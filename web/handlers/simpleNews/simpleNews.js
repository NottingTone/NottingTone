"use strict";

var lists = require('./lists');

function simpleNews () {
	if (lists.length === 0) {
		this.sendNewsResponse('unsupported');
	} else {
		this.sendNewsResponse(lists[this.current]);
	}
}

module.exports = simpleNews;
