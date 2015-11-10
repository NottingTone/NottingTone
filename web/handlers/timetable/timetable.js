"use strict";

function timetable (req, res) {
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {
		// do stuff
		this.sendTemplateResponse('unsupported');
	}
}

module.exports = timetable;
