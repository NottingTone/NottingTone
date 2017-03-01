import { assert } from 'chai';

import ics from './ics';
import pdf from './pdf';
import getUser from '../../../user';

export default async function (ctx, next) {
	 if (ctx.get('User-Agent').match(/micromessenger/i) || !ctx.query.export || !ctx.query.uid) {
	 	return await next();
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
