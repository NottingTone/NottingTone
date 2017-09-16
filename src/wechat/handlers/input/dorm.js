import { getDorms } from '../../../services/coal';

export default async function () {
	if (this.isRestoredHandler()) {
		this.log.func = 'input/dorm';
		const input = this.takeTextInput();
		const match = input && input.match(/^(\d{2})\D+(\d{3,4})$/);
		if (!match) {
			await this.sendTemplateResponse('input/invalid');
			this.interrupt('INPUT', true);
		}
		const building = match[1];
		const room = match[2];
		const dorms = await getDorms();
		if (!dorms[`${building}-${room}`]) {
			await this.sendTemplateResponse('input/dorm-not-found');
			this.interrupt('INPUT', true);
		}
		return this.user.info.dorm = input;
	} else {
		if (!this.user.info.dorm || this.user.context.repeated && (Date.now() - this.user.context.last * 1000 < 5000)) {
			await this.sendTemplateResponse('input/dorm');
			this.interrupt('INPUT', true);
		} else {
			return this.user.info.dorm;
		}
	}
};

export const config = { "name": "INPUT_DORM" };
