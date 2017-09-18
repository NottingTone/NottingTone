import path from 'path';
import send from 'koa-send';
import { assert } from 'chai';

import ics from './ics';
import pdf from './pdf';
import getUser from '../../../user';

export default async function (ctx, next) {
	if (ctx.get('User-Agent').match(/micromessenger/i)) {
		if (ctx.query.export) {
			return await send(ctx, 'export.wechat.html', { root: path.join(__dirname, '../../frontend') });
		} else {
			return await next();
		}
	} else if (!ctx.query.export) {
		return await send(ctx, 'export.browser.html', { root: path.join(__dirname, '../../frontend') })
	}

	ctx.state.user = await getUser(ctx.query.uid, false);

	switch (ctx.query.export) {
	case 'ics':
		return await ics(ctx);
	case 'pdf':
		return await pdf(ctx);
	default:
		assert(false, 'INVALID_EXPORT_TYPE');
	}
};
