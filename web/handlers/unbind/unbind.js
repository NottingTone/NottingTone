"use strict";

function unbind () {

	this.user.info = {};

	var _this = this;

	this.user.save(function () {
		_this.log({}, 'success');
		_this.sendTemplateResponse('success');
	});

}

module.exports = unbind;
