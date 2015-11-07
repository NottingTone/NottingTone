var request      = require('request');

var common       = require('../common');
var responses    = require('../wechatInterface/responses');


function getCoal (build, room) {

}

function coal (req, res) {

	common.getUser(req, res, function (data) {
		
		if (!data.build || !data.room) {
			data.context = {
				type: 'coal',
				expiration: Date.now()/1000|0 + 300
			}
			common.putUser(req, res, data, function () {
				responses.sendResponse(res, 'bindResident', null, req);
			});
		} else {
			var build = data.build;
			var room = data.room;
			responses.sendResponse(res, 'unsupported', null, req);
		}
	});

}

module.exports = coal;
