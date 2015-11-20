"use strict";

function requireStuId () {
	var _this = this;
	this.user.info.context = {
		handler      : 'INPUT_STUID',
		next         : this.prev,
		expiration   : (Date.now()/1000|0) + 300
	};

	this.user.save(function () {
		_this.log({}, '');
		_this.sendTemplateResponse('inputStuId');
	});
}

function inputStuId () {
	var match = this.wxEvent.content.match(/^\s*(65\d{5})\s*$/);
	var _this = this;
	var nextHandler = this.user.info.context.next;
	if (match) {
		this.user.info.stuId = match[1];
		this.user.info.context = null;
		this.user.save(function () {
			_this.log({
				text: _this.wxEvent.content
			}, 'success');
			_this.handOver(nextHandler);
		});
	} else {
		_this.log({
			text: _this.wxEvent.content
		}, 'invalid');
		this.sendTemplateResponse('invalidInput');
	}
}

module.exports = {
	requireStuId   : requireStuId,
	inputStuId     : inputStuId
};
