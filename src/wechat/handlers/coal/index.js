import { getElectricity } from '../../../services/coal';
export config from './config';

export default async function () {
	const dorm = await this.callHandler('INPUT_DORM');
	const electricity = await getElectricity(dorm);
	await this.sendTemplateResponse('coal', {
		dorm,
		electricity,
	});
	this.interrupt();
}
