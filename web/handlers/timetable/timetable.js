"use strict";

var COLUMNS = ['activity', 'size', 'module', 'day', 'start', 'end', 'room', 'roomsize', 'staff', 'weeks'];
var COLUMN_NEEDED = [0, 1, 2, 3, 4, 5, 7, 9, 10, 11];

var request    = require('request');

var config     = require('../../../config');
var db         = require('../../db');

var cache      = require('./cache');


function isSameWeeks(weeksA, weeksB) {
	return JSON.stringify(weeksA) === JSON.stringify(weeksB);
}

function isSameActivities(activityA, activityB) {
	var toCompare = ['activity', 'module', 'day', 'start', 'end', 'room'];
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
				activityList[j].staff.push(activities[i].staff);
				found = true;
				break;
			}
		}
		if (!found) {
			activityList.push(activities[i]);
			activityList[activityList.length-1].staff = [activities[i].staff];
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
	console.log('y1GetGroup');
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
	console.log('y1GetActivityListWithoutSubGroup');
	return new Promise (function (resolve, reject) {
		db.y1timetable.all("SELECT subGroup FROM groupActivity WHERE `group`=? GROUP BY subGroup", [group], function (err, rows) {
			if (err) {
				reject();
			} else {
				if (rows.length > 1) {
					_this.user.info.possibleSubGroups = rows.map(function (x) { return x.subGroup });
					_this.user.save(function () {
						_this.handOver('REQUIRE_SUBGROUP');
						reject(null);
					});
				} else {
					_this.user.info.subGroup = null;
					_this.user.save(function () {
						y1GetActivityList(_this)
						.then(resolve, reject);
					});
				}
			}
		});
	});
}

function y1GetActivityList (_this, group) {
	console.log('y1GetActivityList');
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
	console.log('nonY1getActivityListByStuId');
	return new Promise (function (resolve, reject) {
		var url = 'http://timetablingunnc.nottingham.ac.uk:8005/reporting/Spreadsheet;student;id;' + _this.user.info.stuId + '?days=1-7&weeks=1-52&periods=1-32&template=SWSCUST+student+Spreadsheet';
		request.get(url, function(err, res, body) {
			console.log('请求返回来了……');
			try {
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
					console.log('1');
				}
				resolve(mergeActivities(activityList));
			} catch (e) {
				reject(e);
			}
		});
	});
}

function _getActivityList (_this) {
	console.log('_getActivityList');
	return new Promise (function (resolve, reject) {
		cache.get(_this.user.info.stuId)
		.then(function (ret) {                         // cached
			resolve(ret);
		}, function () {                               // uncached
			y1GetGroup(_this.user.info.stuId)
			.then(function (group) {                   // Y1
				y1GetActivityList(_this, group)
				.then(resolve, reject);
			}, function () {                           // non-Y1
				nonY1getActivityListByStuId(_this)
				.then(resolve, reject);
			});
		});
	});
}

function getActivityList (_this) {
	return new Promise (function (resolve, reject) {
		_getActivityList(_this)
		.then(function (ret) {
			cache.put(_this.user.info.stuId, ret)
			.then(function () {
				resolve(ret);
			})
		})
		.then(null, reject);
	});
}

function timetable () {
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {

		var _this = this;

		var result = [{
			title: "查看完整课表",
			description: "",
			picurl: "",
			url: config.wechat.baseUrl + '/service/timetable/view?stuId=' + this.user.info.stuId
		}, {
			title: "导入到日历",
			description: "",
			picurl: "",
			url: config.wechat.baseUrl + '/service/timetable/import?stuId=' + this.user.info.stuId
		}];

		getActivityList(_this)
		.then (function (ret) {
			_this.sendNewsResponse(result);
		})
		.then (null, function (err) {
			if (err !== null) {
				console.log(err.stack);
				_this.sendTemplateResponse('exception');
			}
		})
	}
}

module.exports = timetable;
