"use strict";

function router () {

	switch (this.wxEvent.type) {
		case 'text':
			if (
				this.user.info.context &&
				this.user.info.context.expiration > (Date.now()/1000|0) &&
				this.user.info.context.handler
			) {
				this.handOver(this.user.info.context.handler);
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
					this.handOver(this.wxEvent.eventKey);
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
