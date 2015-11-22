"use strict";

var path       = require('path');
var fs         = require('fs');
var request    = require('request');
var ejs        = require('ejs');
var request    = require('request');
var mime       = require('mime');

var config     = require('../config');
var db         = require('./db');
var logger     = require('./logger');

var handlers   = require('./handlers/handlers')

var templateDir = path.resolve(__dirname, 'wechatTemplates');

var Handler = (function() {

	function Handler () {

	}

	Handler.prototype.setResponseTimeout = function (time) {
		this.timeout = setTimeout((function() {
			this.sendTemplateResponse('longWait');
		}).bind(this), time);
	}

	// 将事务交与下一个handler处理
	Handler.prototype.handOver = function (nextHandler) {
		if (nextHandler in handlers) {
			this.prev = this.current;
			this.current = nextHandler;
			handlers[nextHandler].call(this);
		} else {
			this.sendTemplateResponse('exception');
		}
	}

	// 发送裸响应
	// 若已发送过相应，则调用客服接口
	Handler.prototype.sendRawResponse = function (type, resp) {
		if (this.respSent) {
			var url = "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=" + config.wechat.accessToken;
			request.post({
				url: url,
				headers: {
					"Content-Type": mime.lookup(type)
				},
				body: resp
			});
		} else {
			this.resp.type(type).send(resp);
			this.respSent = true;
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
		}
	}

	Handler.prototype.sendEmptyResponse = function () {
		this.sendRawResponse('txt', '');
	}

	// 发送模板响应
	Handler.prototype.sendTemplateResponse = function (templateFileName, data) {

		if (!data) {
			data = {};
		}

		data.toUser = this.wxEvent.openid;
		data.fromUser = this.wxEvent.mpid;
		data.timestamp = Date.now() / 1000 | 0;
		data.respSent = this.respSent;

		var templatePath = path.resolve(templateDir, templateFileName + '.ejs');
		var template = fs.readFileSync(templatePath, {encoding: 'utf-8'});
		
		var renderred = ejs.render(template, data, {filename: templatePath});

		var match = renderred.match(/^\s*#\*\s*(\S*)\s*\n([\s\S]*)$/);
		var type = (match && match[1]) || 'txt';
		var body = (match && match[2]) || renderred;
		
		this.sendRawResponse(type, body);

	}

	// 发送文字消息
	Handler.prototype.sendTextResponse = function (text) {
		this.sendTemplateResponse('base/text', {
			text: text
		});
	}

	// 发送图片消息
	Handler.prototype.sendImageResponse = function (mediaId) {
		this.sendTemplateResponse('base/image', {
			mediaId: mediaId
		});
	}

	// 发送语音消息
	Handler.prototype.sendVoiceResponse = function (mediaId) {
		this.sendTemplateResponse('base/voice', {
			mediaId: mediaId
		});
	}

	// 发送视频消息
	Handler.prototype.sendVideoResponse = function (mediaId, thumbMediaId, title, description) {
		this.sendTemplateResponse('base/video', {
			mediaId: mediaId,
			thumbMediaId: thumbMediaId,
			title: title,
			description: description
		});
	}

	// 发送音乐消息
	Handler.prototype.sendMusicResponse = function (url, hqUrl, thumbMediaId, title, description) {
		this.sendTemplateResponse('base/music', {
			url: url,
			hqUrl: hqUrl,
			thumbMediaId: thumbMediaId,
			title: title,
			description: description
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
	Handler.prototype.sendNewsResponse = function (articles) {
		this.sendTemplateResponse('base/news', {
			articles: articles
		});
	}

	// 发送卡券消息
	Handler.prototype.sendCardResponse = function (cardId, cardExt) {
		this.sendTemplateResponse('base/card', {
			cardId: cardId,
			cardExt: cardExt
		});
	}

	Handler.prototype.log = function (param, result) {

		var info = [
			this.wxEvent.openid,
			this.current,
			(Date.now() - this.start) + 'ms',
			JSON.stringify(param),
			result
		];
		logger(info);
	}

	return Handler;

})();


var User = (function() {

	function User (openid) {
		this.openid = openid;
	}

	User.prototype.load = function (cb) {
		var _this = this;
		db.userbind.get(this.openid, function (err, ret) {
			if (err) {
				_this.info = {};
				cb && cb(true);
			} else {
				_this.info = JSON.parse(ret);
				cb && cb(true);
			}
		});
	}

	User.prototype.save = function (cb) {
		db.userbind.put(this.openid, JSON.stringify(this.info), function (err) {
			if (err) {
				cb && cb(false);
			} else {
				cb && cb(true);
			}
		});
	}

	return User;

})();

function initializeHandler (wxEvent, resp) {

	var user = new User(wxEvent.openid);

	var handler = new Handler();

	handler.wxEvent = wxEvent;
	handler.user    = user;
	handler.resp    = resp;
	handler.resSent = false;
	handler.current = 'ROUTER';
	handler.start   = Date.now();

	handler.setResponseTimeout(config.wechat.responseTimeout);

	user.load(function () {
		handlers.ROUTER.call(handler);
	});
}

module.exports = {
	initializeHandler: initializeHandler
}
