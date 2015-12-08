"use strict";

var ensureKfDisconnected = require('./ensureKfDisconnected');

function router () {

	var _this = this;

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
				case 'subscribe':
					this.log('subscribe', '');
					this.sendTemplateResponse('subscribe');
					break;
				case 'unsubscribe':
					this.log('unsubscribe', '');
					this.sendEmptyResponse();
					break;
				case 'CLICK':
					ensureKfDisconnected.call(this)
					.then(function () {
						_this.handOver(_this.wxEvent.eventKey);
					});
					break;
				case 'VIEW':
					this.log({view: this.wxEvent.eventKey}, '');
					this.sendEmptyResponse();
					break;
				case 'kf_create_session':
					if (this.user.info.context && this.user.info.context.handler === 'INPUT_APARTMENT' && this.user.info.context.expiration > (Date.now()/1000|0)) {
						this.sendEmptyResponse();
					} else {
						ensureKfDisconnected.call(this)
						.then(function () {
							_this.sendEmptyResponse();
						})
					}
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
