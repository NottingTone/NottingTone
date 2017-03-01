import Router from 'koa-Router';

import updateWechatMenu from './update-wechat-menu';

const router = new Router();

router.get('/update-wechat-menu', updateWechatMenu);

export default router.routes();
