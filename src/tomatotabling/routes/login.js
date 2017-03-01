import config from '../../config';
import oauth from '../../wechat/routes/oauth';

export default async function (ctx, next) {
	if (ctx.session.userid) {
		await next();
	} else if (ctx.method === 'GET') {
		if (ctx.get('User-Agent').match(/micromessenger/i)) {
			ctx.session.loginRedirect = '/tomatotabling/';
			ctx.redirect('/wechat/oauth/tomatotabling');
		} else {
			ctx.status = 403;
			ctx.body = '';
		}
	} else {
		ctx.status = 403;
		ctx.body = '';
	}
};
