"use strict";

var crypto    = require('crypto');

var db        = require('../../db');

function generateToken (stuId) {
	return new Promise (function (resolve, reject) {
		var sha1sum = crypto.createHash('sha1');
		crypto.randomBytes(128, function (ex, buf) {
			sha1sum.update(buf);
			var token = sha1sum.digest('hex').split('');
			var hexStuId = (stuId % 100000).toString(16);
			while (hexStuId.length < 5) {
				hexStuId = '0' + hexStuId;
			}
			for (var i = 0; i < 5; ++i) {
				token[token[i * 8].charCodeAt(0) % 7 + i * 8 + 1] = hexStuId[i];
			}
			resolve(token.join(''));
		});
	});
}

function get (stuId) {
	return new Promise (function (resolve, reject) {
		db.timetable.get(stuId, function (err, ret) {
			if (err) {
				reject();
			} else {
				var obj = JSON.parse(ret);
				if (obj.expiration > Date.now()/1000|0) {
					resolve({
						data: obj.data,
						token: obj.token
					});
				} else {
					reject();
				}
			}
		});
	});
}

function getByToken (token) {
	return new Promise (function (resolve, reject) {
		var hexStuId = '';
		for (var i = 0; i < 5; ++i) {
			hexStuId += token[token.charCodeAt(i * 8) % 7 + i * 8 + 1];
		}
		var stuId = (6500000 + parseInt(hexStuId, 16)).toString();
		get(stuId)
		.then(resolve, reject);
	});
}

function put (stuId, data) {
	return new Promise (function (resolve, reject) {
		generateToken(stuId)
		.then(function (token) {
			db.timetable.put(stuId, JSON.stringify({
				data: data,
				expiration: Date.now()/1000|0 + 86400,
				token: token
			}), function (err) {
				if (err) {
					reject()
				} else {
					resolve(token);
				}
			});
		});
	})
}

module.exports = {
	get          : get,
	getByToken   : getByToken,
	put          : put
}
