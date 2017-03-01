import { assert } from 'chai';

import { getDataByFilters } from '../../../services/timetable';

export default async function (ctx) {
	const idx = parseInt(ctx.params.idx, 10);
	assert(idx.toString() === ctx.params.idx, 'INVALID_FILTER_ID');
	if (!ctx.state.user.info.timetable) {
		ctx.state.user.info.timetable = {};
	}
	const userData = ctx.state.user.info.timetable;
	if (!userData.filters) {
		userData.filters = [];
	}
	// -1: create new
	// -2: no change
	// other: change
	assert(idx === -1 || idx === -2 || userData.filters[idx], 'INVALID_FILTER_ID');
	const filter = {
		type: ctx.request.body.type,
		id: ctx.request.body.id,
	};
	assert.isString(filter.type, 'INVALID_FILTER_TYPE');
	assert(filter.id, 'INVALID_FILTER');
	if (idx != -1) {
		let unchanged = false;
		for (const [existentIdx, existentFilter] in userData.filters.entries()) {
			if (existentFilter.type === filter.type && existentFilter.id.toString() === filter.id.toString()) {
				if (existentIdx === idx) {
					unchanged = true;
				} else {
					ctx.status = 400;
					ctx.body = '';
					return;
				}
			}
		}
		if (unchanged) {
			ctx.body = {};
			return;
		}
	}
	const data = await getDataByFilters(userData.settings, [filter], true);
	if (idx !== -2) {
		if (idx === -1) {
			userData.filters.push(filter);
		} else {
			userData.filters[idx] = filter;
		}
		await ctx.state.user.save();
	}
	ctx.body = data;
};
