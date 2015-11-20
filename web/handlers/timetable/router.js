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
			data        : ret.data,
			firstWeek   : config.firstWeek,
			colors      : [
				{b: '#c0dfdc', f: '#3f3e3d'},
				{b: '#c1e08e', f: '#3f3e3d'},
				{b: '#e5e1cc', f: '#3f3e3d'},
				{b: '#f1c2b9', f: '#3f3e3d'},
				{b: '#d66476', f: '#3f3e3d'},
				{b: '#d66476', f: '#3f3e3d'},
				{b: '#bebfc9', f: '#3f3e3d'},
				{b: '#60bcac', f: '#3f3e3d'},
				{b: '#e7c4af', f: '#3f3e3d'},
				{b: '#e7d8bb', f: '#3f3e3d'}
			]
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
