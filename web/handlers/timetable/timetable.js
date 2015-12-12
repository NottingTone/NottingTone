"use strict";

var COLUMNS = ['activity', 'size', 'module', 'day', 'start', 'end', 'room', 'roomsize', 'staff', 'weeks'];
var COLUMN_NEEDED = [0, 1, 2, 3, 4, 5, 7, 9, 10, 11];

var request    = require('request');
var moment     = require('moment')

var config     = require('../../../common').config;
var db         = require('../../db');

var cache      = require('./cache');


function isSameWeeks(weeksA, weeksB) {
	return JSON.stringify(weeksA) === JSON.stringify(weeksB);
}

function isSameActivities(activityA, activityB) {
	var toCompare = ['activity', 'module', 'day', 'start', 'end'];
	for (var i in toCompare) {
		if (activityA[toCompare[i]] !== activityB[toCompare[i]]) {
			return false;
		}
	}
	return isSameWeeks(activityA.weeks, activityB.weeks);
}

function mergeActivities(activities) {
	var activityList = [];
	for (var i in activities) {
		var found = false;
		for (var j in activityList) {
			if (isSameActivities(activities[i], activityList[j])) {
				if (activityList[j].staff.indexOf(activities[i].staff) === -1) {
					activityList[j].staff.push(activities[i].staff);
				}
				if (activityList[j].room.indexOf(activities[i].room) === -1) {
					activityList[j].room.push(activities[i].room);
				}
				found = true;
				break;
			}
		}
		if (!found) {
			activityList.push(activities[i]);
			activityList[activityList.length-1].staff = [activities[i].staff];
			activityList[activityList.length-1].room = [activities[i].room];
		}
	}
	for (var i in activityList) {
		if (typeof(activityList[i].weeks) === 'string') {
			activityList[i].weeks = JSON.parse(activityList[i].weeks);
		}
	}
	return activityList;
}

function y1GetGroup (stuId) {
	return new Promise (function (resolve, reject) {
		db.y1timetable.get("SELECT * FROM students WHERE stuId=? LIMIT 1", [stuId], function (err, row) {
			if (!err && row) {
				resolve(row.group);
			} else {
				reject();
			}
		});
	});
}

function y1GetActivityListWithoutSubGroup (_this, group) {
	return new Promise (function (resolve, reject) {
		db.y1timetable.all("SELECT subGroup FROM groupActivity WHERE `group`=? GROUP BY subGroup", [group], function (err, rows) {
			if (err) {
				reject();
			} else {
				if (rows.length > 1) {
					_this.user.info.possibleSubGroups = rows.map(function (x) { return x.subGroup });
					_this.user.save(function () {
						_this.handOver('REQUIRE_SUBGROUP');
						reject('hand over');
					});
				} else {
					_this.user.info.subGroup = null;
					_this.user.save(function () {
						y1GetActivityList(_this, group)
						.then(resolve, reject);
					});
				}
			}
		});
	});
}

function y1GetActivityList (_this, group) {
	return new Promise (function (resolve, reject) {
		if (_this.user.info.subGroup !== undefined) {
			db.y1timetable.all("SELECT * FROM activities WHERE activity IN (SELECT activity FROM groupActivity WHERE `group` = ? AND subGroup IS ?)", [group, _this.user.info.subGroup], function (err, rows) {
				if (err) {
					reject();
				} else {
					if (rows.length == 0) {
						y1GetActivityListWithoutSubGroup(_this, group)
						.then(resolve, reject);
					} else {
						_this.log({
							stuId: _this.user.info.stuId,
							subGroup: _this.user.info.subGroup
						}, 'success, Y1, from db');
						resolve(mergeActivities(rows));
					}
				}
			});
		} else {
			y1GetActivityListWithoutSubGroup(_this, group)
			.then(resolve, reject);
		}
	});
}

function nonY1getActivityListByStuId(_this) {
	return new Promise (function (resolve, reject) {
		var url = 'http://timetablingunnc.nottingham.ac.uk:8005/reporting/Spreadsheet;student;id;' + _this.user.info.stuId + '?days=1-7&weeks=1-52&periods=1-32&template=SWSCUST+student+Spreadsheet';
		request.get({
			url: url,
			timeout: 10000
		}, function(err, res, body) {
			if (err) {
				reject('net error');
			} else if (res.statusCode !== 200) {
				reject('no data');
			} else {
				var activityList = [];
				var table = body.match(/<table  cellspacing='0' cellpadding='2%' border='1'>([\s\S]*?)<\/table>/)[1];
				var regex_tr = /<tr>([\s\S]*?)<\/tr>/g;
				var tr;
				while (tr = regex_tr.exec(table)) {
					var regex_td = /<td>([\s\S]*?)<\/td>/g;
					var tds = [];
					var td;
					while (td = regex_td.exec(tr[1])) {
						tds.push(td[1]);
					}
					var weeks = tds[11];
					weeks = weeks.replace(/- w\/c \w+ [\d\/]*/g, '');
					weeks = weeks.split(', ');
					var ws = [];
					for (var i in weeks) {
						var week = weeks[i];
						var m = week.match(/^w(\d+)$/);
						if (m) {
							ws.push(parseInt(m[1]));
						} else {
							m = week.match(/^w(\d+)-w(\d+)$/);
							for (var j = parseInt(m[1]); j <= parseInt(m[2]); ++j) {
								ws.push(j);
							}
						}
					}
					var activity = {};
					tds[0] = tds[0].replace(' ', '');
					for (var i in COLUMN_NEEDED) {
						activity[COLUMNS[i]] = tds[COLUMN_NEEDED[i]];
					}
					activity.weeks = ws;
					activityList.push(activity);
				}
				resolve(mergeActivities(activityList));
			}
		});
	});
}

function _getActivityList (_this) {
	return new Promise (function (resolve, reject) {
		y1GetGroup(_this.user.info.stuId)
		.then(function (group) {                   // Y1
			y1GetActivityList(_this, group)
			.then(resolve, reject);
		}, function () {                           // non-Y1
			nonY1getActivityListByStuId(_this)
			.then(function (ret) {
				_this.log({
					stuId: _this.user.info.stuId
				}, 'success, non-Y1, from query');
				resolve(ret);
			}, reject);
		});
	});
}

function getActivityList (_this) {
	var key = _this.user.info.subGroup ? _this.user.info.stuId + '/' + _this.user.info.subGroup : _this.user.info.stuId;
	return new Promise (function (resolve, reject) {
		cache.get(key)
		.then(function (ret) {
			_this.log({
				stuId: _this.user.info.stuId
			}, 'success, from cache');
			resolve(ret);
		}, function () {
			var list;
			_getActivityList(_this)
			.then(function (ret) {
				list = ret;
				return cache.put(key, ret);
			})
			.then(function (token) {
				resolve({
					data    : list,
					token   : token
				});
			})
			.then(null, reject);
		});
	});
}

function timetable () {
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {
		var _this = this;

		getActivityList(_this)
		.then (function (ret) {
			var result = [{
				title: "查看完整课表",
				description: "",
				picurl: "http://unnctimetable.com/images/timetable.jpg",
				url: config.wechat.baseUrl + '/services/timetable/' + ret.token + '/view.html'
			}, {
				title: "导入到日历",
				description: "",
				picurl: "",
				url: config.wechat.baseUrl + '/services/timetable/' + ret.token + '/import.html'
			}];

			var incoming = [];

			function addToIncoming(week) {
				for (var idx in ret.data) {
					var activity = ret.data[idx];
					if (activity.weeks.indexOf(week) !== -1) {
						var startTime = moment(activity.start, 'hh:mm');
						var endTime = moment(activity.end, 'hh:mm');
						var end = moment(config.firstWeek)
							.add(week - 1, 'weeks')
							.day(activity.day)
							.hours(endTime.hours())
							.minutes(endTime.minutes())
							.seconds(endTime.seconds());
						var start = moment(config.firstWeek)
							.add(week - 1, 'weeks')
							.day(activity.day)
							.hours(startTime.hours())
							.minutes(startTime.minutes())
							.seconds(startTime.seconds());
						if (end > moment()) {
							incoming.push({
								start: start,
								end: end,
								name: activity.module,
								room: activity.room.join(', ')
							});
						}
					}
				}
			}

			var thisWeek = moment().diff(config.firstWeek, 'week') + 1;

			addToIncoming(thisWeek);
			addToIncoming(thisWeek + 1);
			incoming.sort(function (a, b) {
				return a.start - b.start;
			});

			for (var i = 0; i < Math.min(7, incoming.length); ++i) {
				var activity = incoming[i];
				result.push({
					title: incoming[i].name + '\n@' + incoming[i].start.calendar() + '\n@' + incoming[i].room,
					description: "",
					picurl: "",
					url: ""
				});
			}

			_this.sendNewsResponse(result);

		})
		.then(null, function (err) {
			if (err !== 'hand over') {
				_this.log({
					stuId: _this.user.info.stuId,
					subGroup: _this.user.info.subGroup
				}, 'failure, ' + (typeof err === 'string' ? err : err.message));
				if (err === 'net error') {
					_this.sendTemplateResponse('neterror');
				} else if (err === 'no data') {
					_this.sendTextResponse('没有查询到该生的课表');
				} else {
					_this.sendTemplateResponse('exception');
				}
			}
		})
	}
}

module.exports = timetable;
