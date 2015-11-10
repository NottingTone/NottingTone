"use strict";

var xmlparser    = require('express-xml-bodyparser');
var crypto       = require('crypto');
var config       = require('../config');
var handler      = require('./handler');

var router = require('express').Router();

function checkSigniture (timestamp, nonce, signature) {
	var t = [config.wechat.token, timestamp, nonce];
	t = t.sort().join('');
	t = crypto.createHash('sha1').update(t).digest('hex');
	return t === signature;
}

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

	function getValue (key) {
		return req.body.xml[key] && req.body.xml[key][0];
	}

	var wxEvent = {
		openid        : getValue('fromusername'),
		mpid          : getValue('tousername'),
		type          : getValue('msgtype'),
		content       : getValue('content'),
		picUrl        : getValue('picurl'),
		mediaId       : getValue('mediaid'),
		format        : getValue('format'),
		recognition   : getValue('recognition'),
		thumbMediaId  : getValue('thumbmediaid'),
		locationX     : getValue('location_x'),
		locationY     : getValue('location_y'),
		scale         : getValue('scale'),
		title         : getValue('title'),
		description   : getValue('description'),
		url           : getValue('url'),
		event         : getValue('event'),
		eventKey      : getValue('eventkey'),
		ticket        : getValue('ticket'),
		latitude      : getValue('latitude'),
		longtitude    : getValue('longtitude'),
		precision     : getValue('precision')
	}

	handler.initializeHandler(wxEvent, res);

});

module.exports = router;
