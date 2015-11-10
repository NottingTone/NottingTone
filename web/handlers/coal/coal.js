"use strict";

function coal (req, res) {
	if (!this.user.info.build || !this.user.info.room) {
		this.handOver('REQUIRE_DORM');
	} else {
		// do stuff
		this.sendTemplateResponse('unsupported');
	}
}

module.exports = coal;
