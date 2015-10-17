var router = require('express').Router();

var wechatInterface = require('./modules/wechatInterface/wechatInterface.js');
router.use('/wechat/interface', wechatInterface);

module.exports = router;
