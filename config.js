var path     = require('path');
var fs       = require('fs');

// 读取API配置文件
var config = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json')));

module.exports = config;
