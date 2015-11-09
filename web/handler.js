"use strict";

var path       = require('path');
var fs         = require('fs');
var request    = require('request');
var ejs        = require('ejs');

var db         = require('db');

var router     = require('handlers/router/router');

var templatePath = path.resolve(__dirname, 'wechatTemplates');

var Handler = (function() {

	function Handler () {

	}

	Handler.prototype.setResponseTimeout = function (time) {
		this.timeout = setTimeout((function() {
			this.sendRawResponse('txt', '');
		}).bind(this), time);
	}

	// 将事务交与下一个handler处理
	Handler.prototype.handOver = function (nextHandler) {
		nextHandler.call(this);
	}

	// 发送裸响应
	// 若已发送过相应，则调用客服接口
	Handler.prototype.sendRawResponse = function (type, resp, forceMode) {
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
	Handler.prototype.sendTemplateResponse = function (templateFileName, data) {

		if (!data) {
			data = {};
		}

		data.toUser = wxEvent.openid;
		data.fromUser = wxEvent.mpid;
		data.timestemp = Date.now() / 1000 | 0;
		data.respSent = this.respSent;

		var type = path.extname(templateFileName);
		var template = fs.readFileSync(path.resolve(templatePath, templateFileName));

		this.sendRawResponse(type, ejs.render(template, data), forceMode);

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

	return Handler;

})();


var User = (function() {

	function User (openid) {
		this.openid = openid;
	}

	user.prototype.load = function (cb) {
		db.userbind.get(this.openid, function (err, ret) {
			if (err) {
				cb && cb(false);
			} else {
				this.info = JSON.parse(ret);
				cb && cb(true);
			}
		});
	}

	user.prototype.save = function (cb) {
		db.userbind.put(this.openid, JSON.stringify(this.info), function (err) {
			if (err) {
				cb && cb(false);
			} else {
				cb && cb(true);
			}
		});
	}

	return Handler;

})();

function initializeHandler (wxEvent, resp) {

	var user = new User(wxEvent.openid);

	var handler = new Handler();

	handler.wxEvent = wxEvent;
	handler.user    = user;
	handler.resp    = resp;
	handler.resSent = false;

	user.load(function () {
		router.call(handler);
	});
}

module.exports = {
	initializeHandler: initializeHandler
}
