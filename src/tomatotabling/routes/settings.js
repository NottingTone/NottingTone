import { assert } from 'chai';

const CAMPUSES = ['unnc', 'unuk'];
const BUILDING = ['current', 'legacy'];
const MODULE = ['full', 'code', 'acronym'];
const ALARM = ['no', '-0', '-10', '-20', '-30', '-40', '-50', '-60'];

export default async function (ctx) {
	assert.oneOf(ctx.request.body.campus, CAMPUSES, 'INVALID_CAMPUS');
	if (ctx.request.body.campus === 'unnc') {
		assert.oneOf(ctx.request.body.building, BUILDING, 'INVALID_BUILDING');
	} else {
		assert(ctx.request.body.building === 'current', 'INVALID_BUILDING');
	}
	assert.oneOf(ctx.request.body.module, MODULE, 'INVALID_MODULE');
	assert.oneOf(ctx.request.body.alarm, ALARM, 'INVALID_ALARM');
	if (!ctx.state.user.info.timetable) {
		ctx.state.user.info.timetable = {};
	}
	const userData = ctx.state.user.info.timetable;
	if (userData.settings && userData.settings.campus !== ctx.request.body.campus) {
		userData.filters = [];
		userData.select = {};
	}
	userData.settings = {
		campus: ctx.request.body.campus,
		building: ctx.request.body.building,
		module: ctx.request.body.module,
		alarm: ctx.request.body.alarm,
	};
	await ctx.state.user.save();
	ctx.status = 204;
	ctx.body = '';
};
