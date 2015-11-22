"use strict";

var lists = require('./lists');

function simpleNews () {
	if (lists[this.current].length === 0) {
		this.sendTemplateResponse('unsupported');
	} else {
		this.sendNewsResponse(lists[this.current]);
	}
}

module.exports = simpleNews;
