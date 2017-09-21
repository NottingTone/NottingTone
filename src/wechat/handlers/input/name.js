export default async function () {
	if (this.isRestoredHandler()) {
		this.log.func = 'input/name';
		const input = this.takeTextInput();
		if (input && input.match(/^[A-Za-z '\-\u4e00-\u9fa5]{2,30}$/)) {
			return input.trim();
		} else {
			await this.sendTemplateResponse('input/invalid');
			this.interrupt('INPUT', true);
		}
	} else {
		await this.sendTemplateResponse('input/name');
		this.interrupt('INPUT', true);
	}
};

export const config = { "name": "INPUT_NAME" };
