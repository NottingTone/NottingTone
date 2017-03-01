import { assert } from 'chai';

export default async function (ctx) {
	const idx = parseInt(ctx.params.idx, 10);
	assert(idx.toString() === ctx.params.idx, 'INVALID_FILTER_ID');
	const userData = ctx.state.user.info.timetable;
	assert(userData && userData.filters && userData.filters[idx], 'INVALID_FILTER_ID');
	userData.filters.splice(idx, 1);
	await ctx.state.user.save();
	ctx.status = 204;
	ctx.body = '';
};
