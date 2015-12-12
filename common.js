"use strict";

var fs       = require('fs');
var path     = require('path');
var moment   = require('moment');
var request  = require('request');

var config = require('./config.json');

var logFilename;
var logStream;

function log (info) {
	var logFilenameShouldBe = moment().format('YYYYMMDD') + '.log';
	if (logFilename !== logFilenameShouldBe) {
		logFilename = logFilenameShouldBe;
		logStream = fs.createWriteStream(path.resolve(__dirname, config.log.path, logFilenameShouldBe), {'flags': 'a'});
	}
	if (info instanceof Array) {
		info = info.join('; ');
	}
	logStream.write(moment().format('HH:mm:ss') + '; ' + info + '\n');
}

var grantToken = function () {
	request.get(
		'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.wechat.appid + '&secret=' + config.wechat.appsecret,
		function (err, res, body) {
			var ret;
			if (err || res.statusCode !== 200) {
				log('refresh token; failure; network error');
				setTimeout(grantToken, 2000);
			} else {
				ret = JSON.parse(body);
				if (ret.access_token) {
					log('refresh token; success');
					config.wechat.accessToken = ret.access_token;
				} else {
					log('refresh token; failure; errcode: ' + ret.errcode + '; errmsg: ' + ret.errmsg);
				}
			}
		}
	);
}

// 每小时刷新token
grantToken();
setInterval(grantToken, 1 * 60 * 60 * 1000);

module.exports = {
	config    : config,
	logger    : log
};
