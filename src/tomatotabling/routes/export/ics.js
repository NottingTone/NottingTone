import crypto from 'mz/crypto';
import moment from 'moment';
import path from 'path';
import fs from 'mz/fs';
import ejs from 'ejs';

import { getActiveData } from '../../../services/timetable';
import { mergeSettings } from '../../../services/timetable/settings';
import config from '../../../config';
import { getAcronym, getModuleText, getRoomText } from '../../common/text';
import { getModulesByActivityId } from '../../common/data';

function getUid(activityId, date) {
	const hash = crypto.createHash('sha1');
	hash.update(activityId.toString());
	hash.update('_');
	hash.update(date.unix().toString());
	return hash.digest('hex').replace(/^(.{8})(.{4})(.{4})(.{16}).*$/, '$1-$2-$3-$4');
}

export default async function (ctx) {
	const userData = ctx.state.user.info.timetable || {};
	const settings = mergeSettings(userData.settings);
	const filters = userData.filters || [];
	const select = userData.select || {};
	const semester = config.tomatotabling[settings.campus].semester;
	const week0 = config.tomatotabling[settings.campus].week0;

	const data = await getActiveData(settings, filters, select);

	const events = [];
	for (const activity of data.activities) {
		const modules = getModulesByActivityId(activity.id, data.modules);
		const modulesText = modules.map((module) => getModuleText(settings, module)).join('/');
		const roomsText = activity.rooms.map((room) => getRoomText(settings, room)).join(', ');
		for (const week of activity.weeks) {
			const date = moment(week0).add(week, 'week').day(activity.day);
			const start = moment(activity.start, 'HH:mm');
			const end = moment(activity.end, 'HH:mm');
			events.push({
				uid: getUid(activity.id, date),
				name: modulesText,
				start: date.hour(start.hour()).minute(start.minute()).format('YYYYMMDDTHHmmss'),
				end: date.hour(end.hour()).minute(end.minute()).format('YYYYMMDDTHHmmss'),
				location: roomsText,
			});
		}
	}

	const templatePath = path.join(__dirname, 'templates', `${settings.campus}.ics.ejs`);
	const template = await fs.readFile(templatePath, 'utf-8');
	const renderred = ejs.render(template, {
		events,
		now: moment().format('YYYYMMDDTHHmmss'),
		alarm: settings.alarm,
	}).replace(/\n\s+/g, '\n');

	ctx.type = 'text/calendar';
	ctx.attachment('timetable.ics');
	ctx.body = renderred;
};
