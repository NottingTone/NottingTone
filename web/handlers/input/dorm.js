"use strict";

function requireDorm () {
	var _this = this;
	this.user.info.context = {
		handler      : 'INPUT_DORM',
		next         : this.prev,
		expiration   : Date.now()/1000|0 + 300
	};

	this.user.save(function () {
		_this.sendTemplateResponse('inputDorm');
	});
}

function inputDorm () {
	var match = this.wxEvent.content.match(/^\s*(\d{2})\s*(\d{3,4})\s*$/);
	var _this = this;
	var nextHandler = this.user.info.context.next;
	if (match) {
		this.user.info.build = match[1];
		this.user.info.room = match[2];
		this.user.info.context = null;
		this.user.save(function () {
			_this.handOver(nextHandler);
		});
	} else {
		this.sendTemplateResponse('invalidInput');
	}
}

module.exports = {
	requireDorm   : requireDorm,
	inputDorm     : inputDorm
};
