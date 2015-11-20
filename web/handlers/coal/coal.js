"use strict";

var db        = require('../../db');
var moment    = require('moment');
var request   = require('request');
var iconv     = require('iconv').Iconv;

var gbk2utf8  = new iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');

function str2fen(s) {
	return parseInt(parseFloat(s) * 100);
}

function performQuery(build, room) {

	var URL_QUERY = 'http://60.190.19.138:7080/stu/sel_result.jsp';
	var REGEX_TIME = /The above information up to ([\s\S]*?)<\//;
	var REGEX_BACK = /history\.back\(\);/

	return new Promise(function (resolve, reject) {
		request.post(URL_QUERY, {
			encoding   : null,
			form       : {
				build   : build,
				room    : room,
				xw      : "%D0%A3%CD%E2%B2%E9%D1%AF"
			}
		}, function (err, res, body) {
			if (err || res.statusCode != 200) {
				reject('net error');
			} else {
				body = gbk2utf8.convert(body).toString();
				if (body.match(REGEX_BACK)) {
					reject('no room');
				} else {
					var time_str = body.match(REGEX_TIME)[1];
					var time = moment(time_str, 'YYYY-MM-DD h:mm a').unix();
					var ret = { timestamp: time };

					var REGEX_TH = /<th[\s\S]*?>[\s\S]*?<\/th>/
					var REGEX_TR = /<tr>[\s\S]*?<\/tr>/g;
					var tr_tag;
					while (tr_tag = REGEX_TR.exec(body)) {
						if (tr_tag[0].match(REGEX_TH)) {
							continue;
						} else {
							var item = {};
							var REGEX_TD = /<td [\s\S]*?>([\s\S]*?)<\/td>/g;
							var td_tag = REGEX_TD.exec(tr_tag[0]);
							var name = td_tag[1];
							td_tag = REGEX_TD.exec(tr_tag[0]);
							var value = td_tag[1].match(/[\d\.]+/);
							item.value = value ? str2fen(value[0]) : -1;
							td_tag = REGEX_TD.exec(tr_tag[0]);
							var money = td_tag[1].match(/[\d\.]+/);
							item.money = money ? str2fen(money[0]) : -1;
							if (name.indexOf('冷水表') !== -1) {
								ret.water = item;
							} else if (name.indexOf('热水表') !== -1) {
								ret.hotwater = item;
							} else if (name.indexOf('电表') !== -1) {
								ret.electricity = item;
							}
						}
					}
					resolve(ret);
				}
			}
		});
	});
}

function coal () {
	if (!this.user.info.build || !this.user.info.room) {
		this.handOver('REQUIRE_DORM');
	} else {
		var _this = this;
		var build = this.user.info.build;
		var room = this.user.info.room;
		var now = Date.now()/1000|0;
		db.coal.get('SELECT * FROM data WHERE time>=?-86400 AND time<? AND rid=(SELECT id FROM roomlist WHERE build=? AND room=? LIMIT 1)', [now, now, build, room], function (err, row) {
			if (err) {
				console.log(err);
				_this.sendTemplateResponse('exception');
			} else {
				if (row) {
					_this.log({
						build: build,
						room: room
					}, 'success, from cache');
					_this.sendTemplateResponse('coal', {
						build: build,
						room: room,
						waterValue: row.water_value,
						waterMoney: row.water_money,
						hotwaterValue: row.hotwater_value,
						hotwaterMoney: row.hotwater_money,
						electricityValue: row.electricity_value,
						electricityMoney: row.electricity_money
					});
				} else {
					performQuery(build, room)
					.then(function (ret) {
						_this.log({
							build: build,
							room: room
						}, 'success, from query');
						_this.sendTemplateResponse('coal', {
							build: build,
							room: room,
							waterValue: ret.water.value,
							waterMoney: ret.water.money,
							hotwaterValue: ret.hotwater.value,
							hotwaterMoney: ret.hotwater.money,
							electricityValue: ret.electricity.value,
							electricityMoney: ret.electricity.money
						});
					}, function (e) {
						var msg = typeof e === 'string' ? e : e.message;
						if (e === 'net error') {
							_this.sendTextResponse('网络错误');
						} else if (e === 'no room') {
							_this.sendTextResponse('找不到该寝室');
						} else {
							_this.sendTemplateResponse('exception');
						}
						_this.log({
							build: build,
							room: room
						}, 'failure, ' + msg);
					});
				}
			}
		});
	}
}

module.exports = coal;
