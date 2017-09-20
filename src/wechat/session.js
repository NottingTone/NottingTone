import path from 'path';
import fs from 'mz/fs';
import ejs from 'ejs';
import request from 'request-promise-native';
import winston from 'winston';
import { assert } from 'chai';

import config from '../../config';
import getUser from '../user';
import * as unnamedHandlers from './handlers';
import logger from '../user-logger';

const handlers = new Map();

for (const handler of Object.values(unnamedHandlers)) {
	handlers.set(handler.config.name, handler);
}

const activeUsers = new Set();

export default class Session {
	constructor(event, userid, response, next) {
		Object.assign(this, {
			event,
			userid,
			response,
			next,
		});
		this.respSent = false;
		this.start = Date.now();
		this.context = {
			handlers: [],
			interrupt: 'NORMAL',
			restore: false,
		};
		this.log = {
			func: 'pending',
			args: {},
			message: 'pending',
			level: 'error',
		};
		this.isRestoredSession = false;
	}

	interrupt(data = 'NORMAL', restore = false) {
		this.context.interrupt = data;
		this.context.restore = restore;
		switch (data) {
		case 'NORMAL':
			this.log.level = 'info';
			this.log.message = 'success';
			break;
		case 'INPUT':
			this.log.level = 'info';
			this.log.message = 'input';
			break;
		default:
			this.log.level = 'warn';
			this.log.message = data;
		}
		throw new Error('INTERRUPT');
	}

	isRestoredHandler() {
		return this.isRestoredSession
			&& this.user.context.handlers.length === this.context.handlers.length
			&& this.user.context.handlers.slice(-1)[0] === this.context.handlers.slice(-1)[0];
	}

	takeTextInput() {
		if (this.textInputTaken) {
			return undefined;
		} else {
			this.textInputTaken = true;
			return this.event.content.trim();
		}
	}

	async callHandler(name) {
		if (!this.isRestoredSession && !this.context.handlers.length) {
			this.user.context.repeated = this.user.context.handlers.length && name === this.user.context.handlers[0];
		}
		const handler = handlers.get(name);
		assert(handler && handler.default, `handler "${name}" does not exist`);
		this.context.handlers.push(name);
		const ret = await handler.default.call(this);
		this.context.handlers.pop();
		return ret;
	}

	async sendRawResponseActive(body) {
		const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${config.wechat.accessToken.token}`;
		const ret = await request.post(url, {
			headers: {
				'Content-Type': 'text/json',
			},
			body,
		});
	}

	async sendRawResponsePassive(body) {
		this.respSent = true;
		this.response.type = 'xml';
		this.response.body = body;
	}

	async sendEmptyResponse() {
		await this.sendRawResponsePassive('');
	}

	async sendTemplateResponse(templateName, data = {}) {
		Object.assign(data, {
			toUser: this.event.fromUserName,
			fromUser: this.event.toUserName,
			timestamp: Math.floor(Date.now() / 1000),
			respSent: this.respSent,
			lang: this.user && this.user.lang || 'en',
			urlPrefix: config.urlPrefix,
		});

		const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`);
		// reference path for relative path including
		const includeRefPath = path.join(__dirname, 'templates', 'ref');
		const template = await fs.readFile(templatePath, 'utf-8');
		const renderred = ejs.render(template, data, { filename: includeRefPath });
		if (this.respSent) {
			await this.sendRawResponseActive(renderred);
		} else {
			await this.sendRawResponsePassive(renderred);
		}
	}

	async sendTextResponse(text) {
		await this.sendTemplateResponse('base/text', {
			text,
		});
	}

	// 发送图文消息
	/*
	articles = [
	{
		title: title,
		description: description,
		url: url,
		picUrl: picUrl
	}, 
	...
	]
	*/
	async sendNewsResponse(articles) {
		await this.sendTemplateResponse('base/news', {
			articles: articles,
		});
	}

	async process() {
		if (activeUsers.has(this.userid)) {
			await this.sendTemplateResponse('too-frequent');
			this.log.level = 'warn';
			this.log.message = 'TOO_FREQUENT';
		} else {
			activeUsers.add(this.userid);
			this.user = await getUser(`wechat_${this.userid}`);
			let finished = false;
			let timer = null;
			const dispatch = this.dispatchEvent()
				.then(() => {
					this.commitLog();
					finished = true;
				});
			const timeout = new Promise((resolve, reject) => {
				timer = setTimeout(resolve, config.wechat.responseTimeout);
			});
			await Promise.race([dispatch, timeout]);
			if (finished) {
				clearTimeout(timer);
			} else {
				await this.wait();
				this.commitLog();
			}
			activeUsers.delete(this.userid);
		}
	}

	async wait() {
		this.log.level = 'warn';
		this.log.message = 'wait';
		await this.sendTemplateResponse('wait');
	}

	async ignore() {
		this.log.level = 'info';
		this.log.message = 'ignore';
		await this.sendEmptyResponse();
	}

	async unsupported() {
		this.log.level = 'warn';
		this.log.message = 'unsupported';
		await this.sendTemplateResponse('unsupported');
	}

	async error(message) {
		this.log.level = 'error';
		this.log.message = message;
	}

	commitLog() {
		const level = this.log.level;
		delete this.log.level;
		logger.log(level, {
			...this.log,
			uid: this.user.id,
			duration: Date.now() - this.start,
		});
	}

	async dispatchEvent() {
		try {
			switch (this.event.msgType) {
			case 'text':
				// restore interrupted session
				if (this.user.context.restore) {
					this.isRestoredSession = true;
					await this.callHandler(this.user.context.handlers[0]);
					this.interrupt();
				}
				// text entrance
				for (const [name, handler] of handlers.entries()) {
					if (handler.config && handler.config.entrance && handler.config.entrance.text) {
						for (const strPattern of handler.config.entrance.text) {
							const pattern = new RegExp(`^${strPattern}$`, 'i');
							if (pattern.test(this.event.content)) {
								await this.callHandler(name);
								this.interrupt();
							}
						}
					}
				}
				await this.unsupported();
				break;
			case 'event':
				switch (this.event.event) {
				case 'subscribe':
					await this.sendTemplateResponse('subscribe');
					break;
				case 'unsubscribe':
					await this.sendEmptyResponse();
					break;
				case 'CLICK':
					// menu entrance
					for (const [name, handler] of handlers.entries()) {
						if (handler.config && handler.config.entrance && handler.config.entrance.menu) {
							for (const menu of handler.config.entrance.menu) {
								if (menu === this.event.eventKey) {
									await this.callHandler(name);
									this.interrupt();
								}
							}
						}
					}
					await this.unsupported();
					break;
				default:
					await this.ignore();
				}
				break;
			default:
				await this.unsupported();
			}
			this.interrupt();
		} catch (e) {
			if (e.message !== 'INTERRUPT') {
				await this.error(e.message);
				this.context.interrupt = 'ERROR';
				await this.sendTemplateResponse('error');
			}
		}
		this.user.context = this.context;
		await this.user.save(300);
	}
};
