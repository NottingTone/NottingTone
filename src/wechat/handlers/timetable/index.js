export config from './config';

export default async function () {
	let userData = this.user.info.timetable;

	if (!userData) {
		if (this.isRestoredHandler()) {
			const input = this.takeTextInput();
			const stuId = input.replace(/^(zy|zx)(\d{5})$/, '65$2');
			if (/^(65|200)\d{5}$/.test(stuId)) { // UNNC
				userData = this.user.info.timetable = {
					filters: [{
						type: 'student',
						id: stuId,
					}],
					settings: {
						campus: 'unnc',
					},
				};
			} else if (/^\d{7}$/.test(stuId)) { // UNUK
				userData = this.user.info.timetable = {
					filters: [{
						type: 'student',
						id: stuId,
					}],
					settings: {
						campus: 'unuk',
					},
				};
			} else {
				await this.sendTemplateResponse('input/invalid');
				this.interrupt('INPUT', true);
			}
		} else {
			await this.sendTemplateResponse('input/stuid');
			this.interrupt('INPUT', true);
		}
	}

	if (userData) {
		await this.sendTemplateResponse('timetable', {
			uid: this.user.id,
		});
		this.interrupt();
	}
}
