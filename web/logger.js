var fs       = require('fs');
var path     = require('path');
var moment   = require('moment');

var config   = require('../config');

var logFilename;
var logStream;

function log (info) {
	var logFilenameShouldBe = moment().format('YYYYMMDD') + '.log';
	if (logFilename !== logFilenameShouldBe) {
		logFilename = logFilenameShouldBe;
		logStream = fs.createWriteStream(path.resolve(__dirname, '..', config.log.path, logFilenameShouldBe), {'flags': 'a'});
	}
	if (info instanceof Array) {
		info = info.join('; ');
	}
	logStream.write(moment().format('HH:mm:ss') + '; ' + info + '\n');
}

module.exports = log;
