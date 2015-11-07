function sendResponse(res, templateName, data, req) {

	if (!data) {
		data = {};
	}

	if (req) {
		data.toUser = req.fromusername[0];
		data.fromUser = req.tousername[0];
		data.timestamp = Date.now() / 1000 | 0;
	}
	res.type('xml').render('wechatResponses/' + templateName, data);
}

module.exports = {
	sendResponse: sendResponse
};
