"use strict";

var path       = require('path');
var fs         = require('fs');
var request    = require('request');
var ejs        = require('ejs');

var templatePath = path.resolve(__dirname, 'wechatTemplates');

var handler = (function() {

	function handler (wxEvent, userInfo, resp) {
		this.wxEvent = wxEvent;
		this.userInfo = userInfo;
		this.resp = resp;
		this.respSent = false;
	}

	handler.prototype.setResponseTimeout = function (time) {
		this.timeout = setTimeout((function() {
			this.sendRawResponse('txt', '');
		}).bind(this), time);
	}

	// 将事务交与下一个handler处理
	handler.prototype.handOver = function (nextHandler) {
		theNextHandler = new nextHandler(this.wxEvent, this.userInfo, this.res);
		theNextHandler.go();
	}

	// 发送裸响应
	// 若已发送过相应，则调用客服接口
	handler.prototype.sendRawResponse = function (type, resp, forceMode) {
		if (this.respSent && forceMode == 'passive') {
			throw new Error('Passive mode cannot be used due to sent response.');
		} else if (this.respSent || forceMode === 'active') {
			// https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=ACCESS_TOKEN
		} else {
			this.resp.type(type).send(resp);
			this.respSent = true;
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
		}
	}

	// 发送模板响应
	// sendTemplateResponse (templateFileName, [data], [forceMode])
	// sendTemplateResponse (passiveTemplateFileName, activeTemplateFileName, [data])
	handler.prototype.sendTemplateResponse = function (templateFileName, paramB, paramC, paramD) {

		var data, forceMode;

		if (typeof paramB === 'string' || paramB instanceof String) {
			if (this.respSent) {
				templateFileName = paramB;
			}
			data = paramC;
			forceMode = paramD;
		} else {
			data = paramB;
			forceMode = undefined;
		}

		if (!data) {
			data = {};
		}

		data.toUser = wxEvent.openid;
		data.fromUser = wxEvent.mpid;
		data.timestemp = Date.now() / 1000 | 0;

		var type = path.extname(templateFileName);
		var template = fs.readFileSync(path.resolve(templatePath, templateFileName));

		this.sendRawResponse(type, ejs.render(template, data), forceMode);

	}

	// 发送文字消息
	handler.prototype.sendTextResponse = function (text) {
		this.sendTemplateResponse('base/passive/text.xml', 'base/active/text.json', {
			text: text
		});
	}

	// 发送图片消息
	handler.prototype.sendImageResponse = function (mediaId) {
		this.sendTemplateResponse('base/passive/image.xml', 'base/active/image.json', {
			mediaId: mediaId
		});
	}

	// 发送语音消息
	handler.prototype.sendVoiceResponse = function (mediaId) {
		this.sendTemplateResponse('base/passive/voice.xml', 'base/active/voice.json', {
			mediaId: mediaId
		});
	}

	// 发送视频消息
	handler.prototype.sendVideoResponse = function (mediaId, thumbMediaId, title, description) {
		this.sendTemplateResponse('base/passive/video.xml', 'base/active/video.json', {
			mediaId: mediaId,
			thumbMediaId: thumbMediaId,
			title: title,
			description: description
		});
	}

	// 发送音乐消息
	handler.prototype.sendMusicResponse = function (url, hqUrl, thumbMediaId, title, description) {
		this.sendTemplateResponse('base/passive/music.xml', 'base/active/music.json', {
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
	handler.prototype.sendNewsResponse = function (articles) {
		this.sendTemplateResponse('base/passive/news.xml', 'base/active/news.json', {
			articles: articles
		});
	}

	// 发送卡券消息
	handler.prototype.sendCardResponse = function (cardId, cardExt) {
		this.sendTemplateResponse('base/active/card.json', {
			cardId: cardId,
			cardExt: cardExt
		}, true);
	}

	return handler;

})();

