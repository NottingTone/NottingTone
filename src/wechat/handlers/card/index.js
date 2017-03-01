import moment from 'moment';

import { getCardByStuId, getCardByStuIdName } from '../../../services/card';
export config from './config';

export default async function () {
	const stuId = await this.callHandler('INPUT_STUID');
	let balance;
	try {
		balance = await getCardByStuId(stuId);
	} catch (e) {
		if (e.message !== 'NO_BIND_INFO') {
			throw e;
		}
		const stuName = await this.callHandler('INPUT_NAME');
		try {
			balance = await getCardByStuIdName(stuId, stuName);
		} catch (e) {
			if (e.message !== 'ERROR_IN_BINDING') {
				throw e;
			}
			await this.callHandler('INPUT_NAME');
		}
	}
	await this.sendTemplateResponse('card', {
		stuId,
		balance,
	});
	this.interrupt();
}
