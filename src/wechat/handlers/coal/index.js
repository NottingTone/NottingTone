import { getElectricity } from '../../../services/coal';
export config from './config';

export default async function () {
	this.log.func = 'coal';
	const dorm = await this.callHandler('INPUT_DORM');
	this.log.args.dorm = dorm;
	const electricity = await getElectricity(dorm);
	await this.sendTemplateResponse('coal', {
		dorm,
		electricity,
	});
	this.interrupt();
}
