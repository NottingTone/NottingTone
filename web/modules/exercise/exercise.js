var responses = require('../wechatInterface/responses');

function exercise (req, res) {
	responses.sendResponse(res, 'unsupported', null, req);
}

module.exports = exercise;
