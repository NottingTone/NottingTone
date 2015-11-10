function reading () {
	if (!this.user.courseId) {
		this.handOver('REQUIRE_COURSE');
	} else {
		// do stuff
		this.sendTemplateResponse('unsupported');
	}
}

module.exports = reading;
