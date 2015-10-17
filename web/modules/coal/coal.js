var responses = require('../wechatInterface/responses');

function coal (req, res) {
	responses.sendResponse(res, 'unsupported', null, req);
}

module.exports = coal;
