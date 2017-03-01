import path from 'path';
import crypto from 'mz/crypto';
import Router from 'koa-Router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';

import login from './login';
import session from './session';
import getUser from '../../user';

import my from './my';
import export_ from './export';
import putFilter from './filter/put';
import deleteFilter from './filter/delete';
import search from './search';
import settings from './settings';
import select from './select';
import save from './save';

const router = new Router();

router.use(export_);
router.use(session);
router.use(login);
router.use(async (ctx, next) => {
	ctx.state.user = await getUser(ctx.session.userid);
	await next();
});

router.get('/my', my);

router.use(bodyParser({ enableTypes: ['json'] }));
router.post('/filters/:idx/delete', select, deleteFilter);
router.put('/filters/:idx', select, putFilter);
router.post('/search', search);
router.put('/settings', settings);
router.patch('/select', select, save);

router.use(serve(path.join(__dirname, '../frontend/')));

export default router.routes();
