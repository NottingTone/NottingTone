var router = require('express').Router();

var wechatInterface = require('./wechatInterface.js');
router.use('/wechat/interface', wechatInterface);

module.exports = router;
