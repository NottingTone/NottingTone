"use strict";

var menuHandlers = {
	QUERY_TIMETABLE   : require('../timetable/timetable'),
	QUERY_COAL        : require('../coal/coal'),
	QUERY_EXERCISE    : require('../exercise/exercise'),
	QUERY_READING     : require('../reading/reading'),
	QUERY_UNBIND      : require('../unbind/unbind')
	//TONE_PODCAST      : require('../podcast/podcast'),
	//TONE_PHOTO        : require('../photo/photo'),
	//TONE_VIDEO        : require('../video/video'),
	//TONE_COUPON       : require('../coupon/coupon')
	//ABOUT_TEAM        : require('../team/team'),
	//ABOUT_CONTACT     : require('../contact/contact'),
	//ABOUT_BELIEF      : require('../belief/belief')
};

var textHandlers = {

};

function router () {

	switch (this.wxEvent.type) {
		case 'text':
			if (this.user.info.context && this.user.info.context.handler && this.user.info.context.handler in textHandlers) {
				this.handOver(textHandlers[this.user.info.context.handler]);
			} else {
				this.sendTemplateResponse('unsupported');
			}
			break;
		case 'event':
			switch (this.wxEvent.event) {
				case 'SUBSCRIBE':
					this.sendTemplateResponse('subscribe');
					break;
				case 'CLICK':
					if (this.wxEvent.eventkey in menuHandlers) {
						this.handOver(handlers[this.wxEvent.eventkey]);
					} else {
						this.sendTemplateResponse('unsupported');
					}
					break;
				default:
					// 忽略事件
					this.sendEmptyResponse();
			}
			break;
		default:
			this.sendTemplateResponse('unsupported');
	}
}

module.exports = router;
