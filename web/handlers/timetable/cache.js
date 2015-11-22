"use strict";

var crypto    = require('crypto');

var db        = require('../../db');

function generateToken (key) {
	var stuId = key.split('/')[0];
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
			token = token.join('');
			if (key.indexOf('/') !== -1) {
				token += key.split('/')[1];
			}
			resolve(token);
		});
	});
}

function get (key) {
	return new Promise (function (resolve, reject) {
		db.timetable.get(key, function (err, ret) {
			if (err) {
				reject();
			} else {
				var obj = JSON.parse(ret);
				if (obj.expiration > (Date.now()/1000|0)) {
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
		var key;
		if (token.length > 40) {
			key = stuId + '/' + token.slice(40);
		} else {
			key = stuId;
		}
		get(key)
		.then(function (ret) {
			if (ret.token === token) {
				resolve(ret);
			} else {
				reject();
			}
		}, reject);
	});
}

function put (key, data) {
	return new Promise (function (resolve, reject) {
		generateToken(key)
		.then(function (token) {
			db.timetable.put(key, JSON.stringify({
				data: data,
				expiration: (Date.now()/1000|0) + 86400,
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
