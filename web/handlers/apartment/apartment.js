"use strict";

function apartment () {
	var _this = this;
	this.user.info.context = {
		handler      : 'INPUT_APARTMENT',
		expiration   : (Date.now()/1000|0) + 1200
	};

	this.user.save(function () {
		_this.log({}, '');
		this.handOver('TONE_APARTMENT_N');
	});
}

module.exports = apartment;
