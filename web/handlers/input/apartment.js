"use strict";

function inputApartment () {
	var _this = this;
	this.user.info.context = {
		handler      : 'INPUT_APARTMENT',
		expiration   : (Date.now()/1000|0) + 3600
	};

	this.user.save(function () {
		_this.log({}, '');
		_this.sendTemplateResponse('base/customer');
	});
}

module.exports = inputApartment;
