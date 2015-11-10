"use strict";

function exercise () {
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {
		// do stuff
		this.sendTemplateResponse('unsupported');
	}
}

module.exports = exercise;
