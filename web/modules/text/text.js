var responses = require('../wechatInterface/responses');

function text (req, res) {
	responses.sendResponse(res, 'unsupported', null, req);
}

module.exports = text;
