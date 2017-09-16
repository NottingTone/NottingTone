import moment from 'moment';
import path from 'path';
import fs from 'mz/fs';
import ejs from 'ejs';

import html2pdf from './html2pdf';
import { getActiveData } from '../../../services/timetable';
import { mergeSettings } from '../../../services/timetable/settings';
import config from '../../../config';
import { getAcronym, getModuleText, getRoomText, getWeeksText } from '../../common/text';
import { getTypeStyle } from '../../common/activity-types';
import { getModulesByActivityId } from '../../common/data';
import { GridDay } from '../../common/grid';
import logger from '../../../user-logger';

const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export default async function (ctx) {
	const userData = ctx.state.user.info.timetable || {};
	const settings = mergeSettings(userData.settings);
	const filters = userData.filters || [];
	const select = userData.select || {};
	const semester = config.tomatotabling[settings.campus].semester.split('-').map(x => parseInt(x));
	const week0 = config.tomatotabling[settings.campus].week0;

	const week = moment(week0).add(semester[0], 'week').day('Sun');
	const lastWeek = moment(week0).add(semester[1], 'week').day('Sat');
	const paddings = [
		week.date() - 1,
		lastWeek.daysInMonth() - lastWeek.date(),
	];

	const months = [];
	do {
		months.push({
			month: week.format('MMM'),
			length: week.daysInMonth(),
		});
		week.add(1, 'month');
	} while (lastWeek.isSameOrAfter(week, 'month'));

	const data = await getActiveData(settings, filters, select);

	const activityGrid = [];
	for (let i = 0; i < 5; ++i) {
		activityGrid.push(new GridDay());
	}

	const dayStart = moment('09:00', 'HH:mm');
	for (const activity of data.activities) {
		const modules = getModulesByActivityId(activity.id, data.modules);
		activityGrid[moment(activity.day, 'dddd').day() - 1].addActivity({
			code: activity.code,
			start: moment(activity.start, 'HH:mm').diff(dayStart, 'minutes') / 30,
			end: moment(activity.end, 'HH:mm').diff(dayStart, 'minutes') / 30,
			modules: modules.map((module) => getModuleText(settings, module)),
			rooms: activity.rooms.map((room) => getRoomText(settings, room)),
			staffs: activity.staffs,
			weeks: getWeeksText(activity.weeks),
			type: activity.type,
		});
	}
	const filledGrid = [];
	for (const day of activityGrid) {
		const filledDay = [];
		for (const row of day.rows) {
			row.startRead();
			const filledRow = [];
			let last = 0;
			for (const activity of row.activities) {
				while (last < activity.start) {
					filledRow.push(null);
					++last;
				}
				filledRow.push(activity);
				last = activity.end;
			}
			while (last < 18) {
				filledRow.push(null);
				++last;
			}
			filledDay.push(filledRow);
		}
		filledGrid.push(filledDay);
	}

	const templatePath = path.join(__dirname, 'templates', `template.html.ejs`);
	const template = await fs.readFile(templatePath, 'utf-8');
	const renderred = ejs.render(template, {
		filledGrid,
		times,
		days,
		now: moment().format('MMM DD YYYY HH:mm:ss'),
		settings,
		paddings,
		months,
		semester,
	}).replace(/\n\s+/g, '\n');

	ctx.type = 'application/pdf';
	ctx.attachment('timetable.pdf');
	ctx.body = await html2pdf(renderred);

	logger.log('info', {
		func: 'tomatotabling/export',
		args: {
			type: 'pdf',
		},
		message: 'success',
		uid: ctx.state.user.id,
	});
};
