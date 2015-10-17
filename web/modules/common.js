var db           = require('../db');
var responses    = require('./wechatInterface/responses.js');

function getUser (req, res, cb) {
	db.userbind.get(req.fromusername[0], function (err, ret) {
		if (err) {
			cb({});
		} else {
			cb(JSON.parse(ret));
		}
	});
}

function putUser (req, res, data, cb) {
	db.userbind.put(req.fromusername[0], JSON.stringify(data), function (err) {
		if (err) {
			responses.sendResponse(res, 'exception', null, req);
		} else {
			cb(data);
		}
	});
}

module.exports = {
	getUser: getUser,
	putUser: putUser
}
