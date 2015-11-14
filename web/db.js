var path       = require('path');
var level      = require('level');
var sqlite3    = require('sqlite3');

var config     = require('../config');

function dbGetAbsPath(relPath) {
	return path.resolve(__dirname, '..', 'db', relPath);
}

var userbind      = level(dbGetAbsPath(config.db.level.userbind));
var timetable     = level(dbGetAbsPath(config.db.level.timetable));
var y1timetable   = new sqlite3.Database(dbGetAbsPath(config.db.sqlite.y1timetable));
var coal          = new sqlite3.Database(dbGetAbsPath(config.db.sqlite.coal));

module.exports = {
	userbind      : userbind,
	timetable     : timetable,
	y1timetable   : y1timetable,
	coal          : coal
}
