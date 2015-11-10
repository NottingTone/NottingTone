
function unbind (req, res) {
	common.getUser(req, res, function (data) {
		data.stuId = null;
		data.build = null;
		data.room = null;
		common.putUser(req, res, data, function () {
			responses.sendResponse(res, 'success', null, req);
		});
	});
}

module.exports = unbind;
