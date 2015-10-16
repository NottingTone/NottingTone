#!/usr/bin/env node

var path     = require('path');
var fs       = require('fs');
var request  = require('request');
var url      = require('url');

var common   = require('./common')

// 处理配置文件中的URL，加上前缀
var urlProcess = function (URL) {
	return url.resolve(common.config.wechat.baseUrl + '/', URL);
}

// 读取菜单配置
wechatMenu = JSON.parse(fs.readFileSync(path.join(__dirname, 'WechatMenu.json')));

for (btnTop in wechatMenu.button) {
	if (!wechatMenu.button[btnTop].sub_button) {
		if (wechatMenu.button[btnTop].url) {
			wechatMenu.button[btnTop].url = urlProcess(wechatMenu.button[btnTop].url);
		}
	} else {
		for (btnSecond in wechatMenu.button[btnTop].sub_button) {
			if (wechatMenu.button[btnTop].sub_button[btnSecond].url) {
				wechatMenu.button[btnTop].sub_button[btnSecond].url = urlProcess(wechatMenu.button[btnTop].sub_button[btnSecond].url);
			}
		}
	}
}

common.grantToken(function (token) {
	request.post(
		'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + token,
		{form: JSON.stringify(wechatMenu)},
		function (err, res, body) {
			console.log(body);
		}
	);
});
