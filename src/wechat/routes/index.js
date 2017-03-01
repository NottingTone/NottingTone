import Router from 'koa-Router';
import bodyParser from 'koa-bodyparser';

import webhook from './webhook';
import oauth from './oauth';
import sessionTomatotabling from '../../tomatotabling/routes/session';

const router = new Router();

router.get('/coal/recharge', async (ctx) => ctx.redirect('http://wxschool.lsmart.cn/grids/next.shtml?code=2001&wxArea=16301'));
router.get('/card/recharge', async (ctx) => ctx.redirect('http://wxschool.lsmart.cn/grids/next.shtml?code=1001&wxArea=16301'));

router.use('/webhook', webhook);
router.get('/oauth/tomatotabling', sessionTomatotabling, oauth);

export default router.routes();
