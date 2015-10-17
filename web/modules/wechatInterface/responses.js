var path    = require('path');
var fs      = require('fs');

var filelist = fs.readdirSync(path.resolve(__dirname, 'templates'));

var templates = {};

for (var idx in filelist) {
	var match = filelist[idx].match(/^(.*)\.xml$/);
	if (match) {
		templates[match[1]] = fs.readFileSync(path.resolve(__dirname, 'templates', match[0]), 'utf-8');
	}
}

function getResponse(templateName, data, req) {

	if (!data) {
		data = {}
	}

	if (req) {
		data.toUser = req.fromusername[0];
		data.fromUser = req.tousername[0];
		data.timestamp = Date.now() / 1000 | 0;
	}

	var response = templates[templateName];
	response = response.replace(/\{\{(?:(\{\{)|(.*?)\}\})/g, function (p0, p1, p2) {
		if (p1) {
			return '{{';
		} else if (p2 && p2 in data) {
			return data[p2];
		} else {
			return p0;
		}
	}).replace(/\}\}\}\}/g, '}}');
	return response;
}

function sendResponse(res, templateName, data, req) {
	res.type('xml').end(getResponse(templateName, data, req));
}

module.exports = {
	getResponse: getResponse,
	sendResponse: sendResponse
};
