import Router from 'koa-Router';

import admin from './admin';
import wechat from './wechat';
import telegram from './telegram';
import tomatotabling from './tomatotabling';

const router = new Router();

router.use('/admin', admin);
router.use('/wechat', wechat);
router.use('/telegram', telegram);
router.use('/tomatotabling', tomatotabling);

export default router.routes();
