export default async function () {
	if (this.isRestoredHandler()) {
		this.log.func = 'input/stuid';
		const input = this.takeTextInput();
		this.log.args.input = input;
		const stuId = input && input.replace(/^(zy|zx|65)(\d{5})$/, '165$2');
		if (/^\d{7,8}$/.test(stuId)) {
			return this.user.info.stuId = stuId;
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
