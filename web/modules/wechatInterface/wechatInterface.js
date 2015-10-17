var xmlparser    = require('express-xml-bodyparser');
var crypto       = require('crypto');
var config       = require('../../../config');
var responses    = require('./responses')

var handlers = {
	TEXT              : require('../text/text'),
	QUERY_TIMETABLE   : require('../timetable/timetable'),
	QUERY_COAL        : require('../coal/coal'),
	QUERY_EXERCISE    : require('../exercise/exercise'),
	QUERY_READING     : require('../reading/reading'),
	QUERY_UNBIND      : require('../unbind/unbind')
	//TONE_PODCAST      : require('../podcast/podcast'),
	//TONE_PHOTO        : require('../photo/photo'),
	//TONE_VIDEO        : require('../video/video'),
	//TONE_COUPON       : require('../coupon/coupon')
	//ABOUT_TEAM        : require('../team/team'),
	//ABOUT_CONTACT     : require('../contact/contact'),
	//ABOUT_BELIEF      : require('../belief/belief')
}

function checkSigniture (timestamp, nonce, signature) {
	var t = [config.wechat.token, timestamp, nonce];
	t = t.sort().join('');
	t = crypto.createHash('sha1').update(t).digest('hex');
	return t === signature;
}

var router = require('express').Router();

// 检查token
router.use(function(req, res, next) {
	if (!checkSigniture(req.query.timestamp, req.query.nonce, req.query.signature)) {
		res.status(404).end();
	} else {
		next();
	}
});

router.use(xmlparser());

// 微信接口地址配置
router.get('/', function (req, res) {
	res.status(200).end(req.query.echostr);
});

// 相应微信事件
router.post('/', function (req, res) {
	switch (req.body.xml.msgtype[0]) {
		case 'text':
			handlers.TEXT(req.body.xml, res);
			break;
		case 'event':
			switch (req.body.xml.event[0]) {
				case 'SUBSCRIBE':
					// 订阅欢迎信息
					responses.sendResponse(res, 'subscribe', null, req.body.xml);
					break;
				case 'CLICK':
					if (req.body.xml.eventkey[0] in handlers) {
						// 支持该操作，调用对应handler
						handlers[req.body.xml.eventkey[0]](req.body.xml, res);
					} else {
						// 不支持当前操作
						responses.sendResponse(res, 'unsupported', null, req.body.xml);
					}
					break;
				default:
					// 忽略事件
					res.status(200).end('');
			}
			break;
		default:
			// 不支持当前操作
			responses.sendResponse(res, 'unsupported', null, req.body.xml);
	}
});

module.exports = router;
