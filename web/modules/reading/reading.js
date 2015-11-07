var responses = require('../wechatInterface/responses');
var common    = require('../common');

function reading (req, res) {

	common.getUser(req, res, function (data) {
		
		if (!data.context || !data.context.courseId) {
			data.context = {
				type: 'inputCourse',
				expiration: Date.now()/1000|0 + 300
			};
			common.putUser(req, res, data, function () {
				responses.sendResponse(res, 'inputCourse', null, req);
			});
		} else {
			var courseId = data.context.courseId;
			data.context = null;
			common.putUser(req, res, data, function () {
				responses.sendResponse(res, 'unsupported', null, req);
			});
		}
	});
}

module.exports = reading;
