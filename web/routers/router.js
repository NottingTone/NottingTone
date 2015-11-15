var router = require('express').Router();

var wechatInterface = require('./wechatInterface.js');
var services        = require('./services.js');

function sendStatus (code) {
	return function (req, res) {
		res.status(code).end();
	}
}

router.use('/wechat/interface', wechatInterface);

router.use('/services', services);
router.get('/services', sendStatus(403));


module.exports = router;
