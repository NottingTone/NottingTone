"use strict";

function requireCourse () {
	var _this = this;
	this.user.info.context = {
		handler      : 'INPUT_COURSE',
		next         : this.prev,
		expiration   : Date.now()/1000|0 + 300
	};

	this.user.save(function () {
		_this.sendTemplateResponse('inputCourse');
	});
}

function inputCourse () {
	var match = this.wxEvent.content.match(/^\s*([A-Za-z0-9]{6})\s*$/);
	var _this = this;
	var nextHandler = this.user.info.context.next;
	if (match) {
		this.user.courseId = match[1];
		this.user.info.context = null;
		this.user.save(function () {
			_this.handOver(nextHandler);
		});
	} else {
		this.sendTemplateResponse('invalidInput');
	}
}

module.exports = {
	requireCourse   : requireCourse,
	inputCourse     : inputCourse
};
