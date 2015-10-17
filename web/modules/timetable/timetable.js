var responses = require('../wechatInterface/responses');

function timetable (req, res) {
	responses.sendResponse(res, 'unsupported', null, req);
}

module.exports = timetable;
