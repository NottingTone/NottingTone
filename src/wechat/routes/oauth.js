import crypto from 'mz/crypto';
import { assert } from 'chai';
import Router from 'koa-Router';
import request from 'request-promise-native';

import config from '../../config';

export default async function (ctx) {
	if (ctx.query.state) {
		assert.match(ctx.get('User-Agent'), /micromessenger/i);
		assert(ctx.query.state);
		assert(ctx.query.state === ctx.session.wxState);
		assert(ctx.query.code);
		assert(encodeURIComponent(ctx.query.code) === ctx.query.code);
		const unionid = await getUnionid(ctx.query.code);
		if (unionid) {
			ctx.session.userid = `wechat_${unionid}`;
			ctx.redirect(ctx.session.loginRedirect);
			delete ctx.session.loginRedirect;
		} else {
			ctx.status = 403;
		}
	} else {
		assert(ctx.session.loginRedirect);
		const state = (await crypto.randomBytes(10)).toString('hex');
		ctx.session.wxState = state;	
		const fullUrl = `${ctx.protocol}://${ctx.get('host')}${ctx.originalUrl}`;
		const urlGrantCode =
			`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.wechat.appid}` +
			`&redirect_uri=${fullUrl}` +
			`&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;
		ctx.redirect(urlGrantCode);
	}
};

async function getUnionid(code) {
	const urlGrantId =
		`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.wechat.appid}` +
		`&secret=${config.wechat.appsecret}` +
		`&code=${encodeURIComponent(code)}&grant_type=authorization_code`;
	const body = await request.get({
		url: urlGrantId,
		json: true,
	});
	return body.unionid;
}
