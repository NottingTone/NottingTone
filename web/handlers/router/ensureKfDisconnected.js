"use strict";

var request = require('request');

var config  = require('../../../common').config;
var logger  = require('../../../common').logger;

function getKfAccount (token, openid) {
	return new Promise(function (resolve, reject) {
		var urlGetStatus = 'https://api.weixin.qq.com/customservice/kfsession/getsession?access_token=' + token + '&openid=' + openid;
		request.get(urlGetStatus, function (err, res, body) {
			if (err || res.statusCode != 200) {
				logger('ensureKfDisconnected; failure; getKfAccount; network error');
				reject('exit error');
			} else {
				var ret = JSON.parse(body);
				if (ret.errcode !== 0) {
					logger('ensureKfDisconnected; failure; getKfAccount; errcode: ' + ret.errcode + '; errmsg: ' + ret.errmsg);
					reject('exit error');
				} else {
					if (ret.kf_account === '') {
						reject('no kf');
					} else {
						resolve(ret.kf_account);
					}
				}
			}
		});
	});
}

function disconnectKfAccount (token, openid, kfAccount) {
	return new Promise(function (resolve, reject) {
		var urlDisconnect = 'https://api.weixin.qq.com/customservice/kfsession/close?access_token=' + token;
		request.post(urlDisconnect, {form: JSON.stringify({
			"kf_account" : kfAccount,
			"openid" : openid,
			"text" : "会话超时或用户退出"
		})}, function (err, res, body) {
			if (err || res.statusCode != 200) {
				logger('ensureKfDisconnected; failure; disconnectKfAccount; network error');
				reject('exit error');
			} else {
				var ret = JSON.parse(body);
				if (ret.errcode !== 0) {
					logger('ensureKfDisconnected; failure; disconnectKfAccount; errcode: ' + ret.errcode + '; errmsg: ' + ret.errmsg);
					reject('exit error');
				} else {
					resolve();
				}
			}
		});
	});
}

function ensureKfDisconnected () {
	var _this = this;
	return new Promise (function (resolve, reject) {
		if (_this.inKfMode() && _this.wxEvent.eventKey !== 'TONE_APARTMENT') {
			var token = config.wechat.accessToken;
			var openid = _this.wxEvent.openid;
			getKfAccount(token, openid)
			.then(function (kfAccount) {
				return disconnectKfAccount(token, openid, kfAccount);
			})
			.then(resolve, function (err) {
				if (err === 'no kf') {
					resolve();
				} else if (err === 'exit error') {
					_this.sendTextResponse('退出客服失败');
					reject();
				} else {
					_this.sendTemplateResponse('exception');
					reject();
				}
			});
		} else {
			resolve();
		}
	});
}

module.exports = ensureKfDisconnected;
