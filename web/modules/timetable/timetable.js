var responses = require('../wechatInterface/responses');
var common    = require('../common');

function timetable (req, res) {

	common.getUser(req, res, function (data) {
		if (!data.stuId) {
			data.context = {
				type: 'timetable',
				expiration: Date.now()/1000|0 + 300
			}
			common.putUser(req, res, data, function () {
				responses.sendResponse(res, 'bindStuId', null, req);
			});
		} else {
			var stuId = data.stuId;
			responses.sendResponse(res, 'unsupported', null, req);
		}
	});

}

module.exports = timetable;
