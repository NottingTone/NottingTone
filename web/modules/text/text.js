var common       = require('../common');

var responses    = require('../wechatInterface/responses');

var handlers = {
	QUERY_TIMETABLE   : require('../timetable/timetable'),
	QUERY_COAL        : require('../coal/coal'),
	QUERY_EXERCISE    : require('../exercise/exercise'),
	QUERY_READING     : require('../reading/reading')
}


function bindStuId (req, res, data, cb) {
	if (req.content[0].match(/65\d{5}/)) {
		data.stuId      = req.content[0];
		data.context    = null;
		common.putUser(req, res, data, cb);
	} else {
		responses.sendResponse(res, 'invalidData', null, req);
	}
}

function bindResident (req, res, data, cb) {
	var match = req.content[0].match(/^(\d{2})\s+(\d{3,4})$/);
	if (match) {
		data.build      = match[1];
		data.room       = match[2];
		data.context    = null;
		common.putUser(req, res, data, cb);
	} else {
		responses.sendResponse(res, 'invalidData', null, req);
	}
}

function inputCourse (req, res, data, cb) {
	if (req.content[0].match(/[A-Z0-9]{6}/)) {
		data.context.courseId    = req.content[0];
		common.putUser(req, res, data, cb);
	} else {
		responses.sendResponse(res, 'invalidData', null, req);
	}
}


function text (req, res) {
	common.getUser(req, res, function (data) {
		if (!data.context || data.context.expiration < Date.now()/1000|0) {
			responses.sendResponse(res, 'unsupported', null, req);
		} else {
			switch (data.context.type) {
				case 'timetable':
					bindStuId(req, res, data, function (data) {
						handlers.QUERY_TIMETABLE(req, res);
					});
					break;
				case 'coal':
					bindResident(req, res, data, function (data) {
						handlers.QUERY_COAL(req, res);
					});
					break;
				case 'exercise':
					bindStuId(req, res, data, function (data) {
						handlers.QUERY_EXERCISE(req, res);
					});
					break;
				case 'inputCourse':
					inputCourse(function (courseId) {
						handlers.QUERY_READING(req, res);
					});
					break;
				default:
					responses.sendResponse(res, 'unsupported', null, req);
			}
		}
	});
}

module.exports = text;
