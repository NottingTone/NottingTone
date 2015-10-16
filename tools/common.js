var path     = require('path');
var fs       = require('fs');
var request  = require('request');

// 读取API配置文件
var config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')));

// 获取微信的ACCESS TOKEN
var grantToken = function (cb) {
	request.get(
		'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.wechat.appid + '&secret=' + config.wechat.appsecret,
		function (err, resp, body) {
			cb(JSON.parse(body).access_token);
		}
	);
}

module.exports = {
	config: config,
	grantToken: grantToken
}
