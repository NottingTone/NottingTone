import { getDataByFilters } from '../../services/timetable';
import { mergeSettings } from '../../services/timetable/settings';
import config from '../../config';

export default async function (ctx) {
	const userData = ctx.state.user.info.timetable || {};
	const settings = mergeSettings(userData.settings);
	const week0 = {};
	const semester = {};
	for (const [campus, options] of Object.entries(config.tomatotabling)) {
		week0[campus] = options.week0;
		semester[campus] = options.semester;
	}
	const filters = userData.filters || [];
	const data = await getDataByFilters(settings, filters);
	const select = userData.select || {};
	Object.assign(data, {
		settings,
		week0,
		semester,
		select,
		uid: ctx.state.user.id,
	});
	ctx.body = data;
}
