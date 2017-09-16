import moment from 'moment';

import { getOverview } from '../../../services/exercise';
export config from './config';

export default async function () {
	this.log.func = 'exercise';
	const stuId = await this.callHandler('INPUT_STUID');
	this.log.args.stuId = stuId;
	const overview = await getOverview(stuId);
	let lastRecord;
	if (overview.thisTerm.last === -1) {
		lastRecord = 'None';
	} else {
		lastRecord = moment.unix(overview.thisTerm.last).locale(this.user.info.lang).format('ll HH:mm');
	}
	await this.sendTemplateResponse('exercise', {
		lastTermNum: overview.lastTerm.number,
		thisTermNum: overview.thisTerm.number,
		lastRecord,
	});
	this.interrupt();
}
