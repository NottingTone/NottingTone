var request  = require('request');

var config = require('./config.json');

var grantToken = function () {
	request.get(
		'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.wechat.appid + '&secret=' + config.wechat.appsecret,
		function (err, resp, body) {
			config.wechat.accessToken = JSON.parse(body).access_token;
			config.wechat.accessTokenGranted && config.wechat.accessTokenGranted();
		}
	);
}

// 每小时刷新token
grantToken();
setInterval(grantToken, 1 * 60 * 60 * 1000);


module.exports = config;
