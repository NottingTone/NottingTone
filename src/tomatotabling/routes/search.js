import { assert } from 'chai';

import { search } from '../../services/timetable';

export default async function (ctx) {
	assert.isString(ctx.request.body.type, 'INVALID_TYPE');
	assert.isString(ctx.request.body.key, 'INVALID_KEY');

	const userData = ctx.state.user.info.timetable || {};
	const ret = await search(userData.settings, ctx.request.body.type, ctx.request.body.key);
	ctx.body = ret;
}
