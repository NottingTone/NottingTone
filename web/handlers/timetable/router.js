"use strict";

var path      = require('path');
var express   = require('express');

var router    = require('express').Router();

var cache     = require('./cache');
var calendar  = require('./calendar');
var config    = require('../../../config');

router.get('/:token/view.html', function (req, res) {
	console.log(req.params.token);
	cache.getByToken(req.params.token)
	.then(function (ret) {
		res.status(200);
		res.render(path.resolve(__dirname, 'views/view'), {
			data        : JSON.stringify(ret.data),
			firstWeek   : config.firstWeek
		});
	}, function () {
		res.status(404).end();
	})
});

router.get('/:token/import.ics', calendar.serveIcs);
router.get('/:token/import.html', calendar.servePrompt);

router.get('/', function (req, res) {
	res.status(403).end();
})

router.use(express.static(path.resolve(__dirname, 'static')));

module.exports = router;
