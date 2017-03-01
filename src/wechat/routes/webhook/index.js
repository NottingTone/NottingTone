import Router from 'koa-Router';
import bodyParser from 'koa-bodyparser';

import signatureValidator from './signature-validator';
import onConfigure from './on-configure';
import onEvent from './on-event';

const router = new Router();
router.use(signatureValidator);
router.get('/', onConfigure);
router.post('/', bodyParser({
	enableTypes: ['text'],
	extendTypes: {
		text: ['text/xml'],
	},
}), onEvent);

export default router.routes();
