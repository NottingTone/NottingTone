export default async function () {
	if (this.isRestoredHandler()) {
		const input = this.takeTextInput();
		const stuId = input && input.replace(/^(zy|zx)(\d{5})$/, '65$2');
		if (/^(65|200)\d{5}$/.test(stuId)) {
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
