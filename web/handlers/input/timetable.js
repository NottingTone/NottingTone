"use strict";

function requireSubGroup () {
	var _this = this;
	this.user.info.context = {
		handler      : 'INPUT_SUBGROUP',
		next         : this.prev,
		expiration   : (Date.now()/1000|0) + 300
	};

	this.user.save(function () {
		_this.sendTemplateResponse('inputSubGroup', {
			choices: _this.user.info.possibleSubGroups.map(function (val, idx) {
				return idx + ": " + val;
			}).join('\n')
		});
	});
}

function inputSubGroup () {
	var _this = this;
	var nextHandler = this.user.info.context.next;
	if (parseInt(this.wxEvent.content) in this.user.info.possibleSubGroups) {
		this.user.info.subGroup = this.user.info.possibleSubGroups[parseInt(this.wxEvent.content)];
		this.user.info.context = null;
		this.user.info.possibleSubGroups = null;
		this.user.save(function () {
			_this.handOver(nextHandler);
		});
	} else {
		this.sendTemplateResponse('invalidInput');
	}
}

module.exports = {
	requireSubGroup   : requireSubGroup,
	inputSubGroup     : inputSubGroup
};
