"use strict";

function unbind (req, res) {

	this.user.info = {};

	var _this = this;

	this.user.save(function () {
		_this.sendTemplateResponse('success');
	});

}

module.exports = unbind;
