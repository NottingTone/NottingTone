var responses = require('../wechatInterface/responses');

function reading (req, res) {
	responses.sendResponse(res, 'unsupported', null, req);
}

module.exports = reading;
