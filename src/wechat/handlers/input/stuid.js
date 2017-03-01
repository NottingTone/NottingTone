export default async function () {
	if (this.isRestoredHandler()) {
		const input = this.takeTextInput();
		const match = input && input.match(/^(?:zy|zx|65)(\d{5})$/);
		if (match) {
			return this.user.info.stuId = `65${match[1]}`;
		} else {
			await this.sendTemplateResponse('input/invalid');
			this.interrupt('INPUT', true);
		}
	} else {
		if (!this.user.info.stuId || this.user.context.repeated && (Date.now() - this.user.context.last * 1000 < 5000)) {
			await this.sendTemplateResponse('input/stuid');
			this.interrupt('INPUT', true);
		} else {
			return this.user.info.stuId;
		}
	}
};

export const config = { "name": "INPUT_STUID" };
