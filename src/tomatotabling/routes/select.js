import { assert } from 'chai';

export default async function (ctx, next) {
	if (ctx.request.body && ctx.request.body.select) {
		assert.isObject(ctx.request.body.select);
		if (!ctx.state.user.info.timetable) {
			ctx.state.user.info.timetable = {};
		}
		const userData = ctx.state.user.info.timetable;
		if (!userData.select) {
			userData.select = {};
		}
		for (const [typeobj, state] of Object.entries(ctx.request.body.select)) {
			if (state === -1) {
				delete userData.select[typeobj];
			} else {
				userData.select[typeobj] = state;
			}
		}
	}
	await next();
};
