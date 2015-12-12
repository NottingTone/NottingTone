"use strict";

var path      = require('path');
var moment    = require('moment');
var uuid      = require('node-uuid');

var config    = require('../../../common').config;
var cache     = require('./cache');
var logger    = require('../../../common').logger;

function getDateTime (week, day, time) {
	var date = moment(config.firstWeek).add(week - 1, 'week').day(day);
	var time = moment(time, 'hh:mm');
	date.hours(time.hours());
	date.minutes(time.minutes());
	date.seconds(time.seconds());
	return date;
}

function serveIcs (req, res) {
	var ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	cache.getByToken(req.params.token)
	.then(function (ret) {
		var activityList = ret.data;
		var events = [];
		for (var i in activityList) {
			for (var j in activityList[i].weeks) {
				events.push({
					uid: uuid.v1(),
					start: getDateTime(activityList[i].weeks[j], activityList[i].day, activityList[i].start),
					end: getDateTime(activityList[i].weeks[j], activityList[i].day, activityList[i].end),
					name: activityList[i].module,
					location: activityList[i].room
				});
				
			}
		}
		logger([
			ip,
			'TIMETABLE_IMPORT',
			req.params.token,
			'success'
		]);
		res.type('ics').render(path.resolve(__dirname, 'views/ics'), {
			events: events,
			now: moment(),
			toISO: function (t) {
				return t.format('YYYYMMDDTHHmmss');
			}
		});
	}, function () {
		logger([
			ip,
			'TIMETABLE_IMPORT',
			req.params.token,
			'invalid'
		]);
		res.status(404).end();
	});
}

function servePrompt (req, res) {
	var ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	cache.getByToken(req.params.token)
	.then(function () {
		logger([
			ip,
			'TIMETABLE_IMPORT_PROMPT',
			req.params.token,
			'success'
		]);
		res.render(path.resolve(__dirname, 'views/prompt'), {
			token: req.param.token
		});
	}, function () {
		logger([
			ip,
			'TIMETABLE_IMPORT_PROMPT',
			req.params.token,
			'invalid'
		]);
		res.status(404).end();
	});
}

module.exports = {
	serveIcs      : serveIcs,
	servePrompt   : servePrompt
};
