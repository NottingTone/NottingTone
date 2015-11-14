"use strict";

var db = require('../../db');

function get (stuId) {
	return new Promise (function (resolve, reject) {
		db.timetable.get(stuId, function (err, ret) {
			if (err) {
				reject();
			} else {
				var obj = JSON.parse(ret);
				if (obj.expiration > Date.now()/1000|0) {
					resolve(obj.data);
				} else {
					reject();
				}
			}
		});
	});
}

function put (stuId, data) {
	return new Promise (function (resolve, reject) {
		db.timetable.put(stuId, JSON.stringify({
			data: data,
			expiration: Date.now()/1000|0 + 86400
		}), function (err) {
			if (err) {
				reject()
			} else {
				resolve();
			}
		})
	})
}

module.exports = {
	get: get,
	put: put
}
