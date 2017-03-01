import { assert } from 'chai';

export default async function (ctx) {
	await ctx.state.user.save();
	ctx.status = 204;
	ctx.body = '';
};
