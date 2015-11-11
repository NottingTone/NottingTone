"use strict";

var request = require('request');
var iconv = require('iconv').Iconv;

var gbk2utf8 = new iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');

var TYPEID = {
	'morning': '0304',
	'exercise': '0302',
	'run': '0303'
}

function getExerciseNumber (stuId, term, type) {
	return new Promise (function (resolve, reject) {
		var url = {
			'last': "https://sports.nottingham.edu.cn/Student/kaoqingchaxun/pe/index1.asp",
			'this': "https://sports.nottingham.edu.cn/Student/kaoqingchaxun/pe/index.asp"
		}[term] + "?types=" + TYPEID[type];
		request.get({
			url: url,
			encoding: null,
			headers: {
				Cookie: "C%5FStudent%5FNo=" + stuId
			}
		}, function (err, res, body) {
			if (err || res.statusCode != 200) {
				reject();
			} else {
				body = gbk2utf8.convert(body).toString();
				var match = body.match(/<td bgcolor=#ffffff colspan=6>\s*共([\s\S]*?)次\s*<\/td>/);
				if (match) {
					var match = match[1].match(/\d+/);
					if (match) {
						resolve(parseInt(match[0]))
					} else {
						resolve(0);
					}
				} else {
					resolve(0);
				}
			}
		});
	});
}

function getCredit (stuId) {
	return new Promise (function (resolve, reject) {
		var result = {};

		var urlCredit = "http://nottingham.coding.io/ajax/getCredits.php?student_no=" + stuId;

		request.get(urlCredit, function (err, res, body) {
			if (err || res.statusCode != 200) {
				reject();
			} else {
				resolve(JSON.parse(body))
			}
		});
	});
}

function exercise (req, res) {

	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {

		var result = {
			stuId: this.user.info.stuId
		};

		var _this = this;
		getCredit(this.user.info.stuId)
		.then(function (data) {
			result.projectCredit = data.project_credit;
			result.safetyCredit = data.safety_credit;
			result.scoutCredit = data.scout_credit;

			var params = [
				[_this.user.info.stuId, 'this', 'morning'],
				[_this.user.info.stuId, 'this', 'exercise'],
				[_this.user.info.stuId, 'this', 'run'],
				[_this.user.info.stuId, 'last', 'morning'],
				[_this.user.info.stuId, 'last', 'exercise'],
				[_this.user.info.stuId, 'last', 'run'],
			]
			return Promise.all(params.map(Function.prototype.apply.bind(getExerciseNumber,null)));
		})
		.then(function (data) {
			result.thisTermExercise = data[0] + data[1] + data[2];
			result.lastTermExercise = data[3] + data[4] + data[5];
			_this.sendTemplateResponse('exercise', result);
		})
		.then(null, function (err) {
			_this.sendTemplateResponse('exception');
		});
	}
}

module.exports = exercise;
