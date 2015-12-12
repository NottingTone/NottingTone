"use strict";

var basicAuth    = require('basic-auth-connect');
var router       = require('express').Router();
var fs           = require('fs');
var path         = require('path');

var config       = require('../../common').config;
var lists        = require('../handlers/simpleNews/lists');

var fields = [
	'title',
	'description',
	'picurl',
	'url'
];

function getPath (list) {
	return path.resolve(__dirname, '../wechatTemplates/editable', list);
}

for (var key in lists) {
	try {
		lists[key] = JSON.parse(fs.readFileSync(getPath(key)));
	} catch (e) {
		lists[key] = [];
	}
}


router.use(basicAuth(config.admin.username, config.admin.password));

router.get('/lists/all', function (req, res) {
	res.render('admin/lists', {
		lists: lists
	});
});

router.get('/lists/:list/edit', function (req, res) {
	if (req.params.list in lists) {
		res.render('admin/list', {
			list: req.params.list,
			data: lists[req.params.list]
		});
	} else {
		res.status(404).end();
	}
});

router.post('/lists/:list/push', function (req, res) {
	if (req.params.list in lists) {
		lists[req.params.list] = [];
		for (var i = 0; i < 10; ++i) {
			var exist = false;
			var item = {};
			for (var j in fields) {
				item[fields[j]] = req.body[i + '.' + fields[j]];
				if (req.body[i + '.' + fields[j]] !== '') {
					exist = true;
				}
			}
			if (exist) {
				lists[req.params.list].push(item);
			}
		}
		fs.writeFileSync(getPath(req.params.list), JSON.stringify(lists[req.params.list]));
		res.end('修改成功');
	} else {
		res.status(404).end();
	}
});

module.exports = router;
