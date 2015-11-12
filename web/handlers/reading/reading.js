"use strict";

var request = require('request');

function reading () {
	if (!this.user.courseId) {
		this.handOver('REQUIRE_COURSE');
	} else {
		var _this = this;
		getCourse(this.user.courseId)
		.then(function (data) {
			return getCourseReadingList(data.url, data.name);
		}, function () {
			_this.sendTemplateResponse('readingNoList');
		})
		.then(function (data) {
			_this.sendNewsResponse(data);
		})
		.then(null, function (err) {
			console.error(err);
			_this.sendTemplateResponse('exception');
		});
	}
}

function getCourse (courseId) {
	return new Promise (function (resolve, reject) {
		_getCourse('unnc', courseId)
		.then(resolve, function () {
			return _getCourse('unuk', courseId);
		})
		.then(resolve, reject);
	});
}

function _getCourse (campus, courseId) {
	return new Promise (function (resolve, reject) {
		
		var url = {
			'unnc': 'http://readinglists.nottingham.edu.cn/search.html?q=',
			'unuk': 'http://readinglists.nottingham.ac.uk/search.html?q='
		}[campus] + courseId;
		request(url, function (error, response, body) {
			if (error || response.statusCode !== 200) {
				reject();
			} else {
				var now = new Date();
				var year = now.getFullYear();
				if (now.getMonth < 8) { // August or earlier
					year -= 1;
				}

				var regFindModule = new RegExp("<span class='label label-success'>List<\\/span> <a href='(.*?)' .*?><strong>(.*?)<\\/strong><\\/a> \\(" + year + "\\/" + (year + 1) + "\\)<\\/div>");
				var match = body.match(regFindModule);
				if (match) {
					resolve({
						url: match[1],
						name: match[2]
					});
				} else {
					reject();
				}
			}
		});	
	});
}

function getCourseReadingList (url, name) {
	return new Promise (function (resolve, reject) {
		var article = {};
		var articleArray = [];
		
		request(url, function (error, response, body) {
			if (error || response.statusCode !== 200) {
				reject();
			} else {
				var articles = [{
					title         : name,
					description   : "",
					picurl        : "http://unnctimetable.com/images/library.jpg",
					url           : url
				}];

				var regFindReading = /<li class="item".*?>([\s\S]*?)<\/li>/g;
				var match;

				while (match = regFindReading.exec(body)) {
					if (articles.length >= 10) {
						articles.pop();
						articles.push({
							title         : "查看更多",
							description   : "",
							picurl        : "http://unnctimetable.com/images/book.jpg",
							url           : url
						});
						break;
					}

					var match1;
					var label, title, bookUrl;
					match1 = match[1].match(/<span class='resourceType label'>(.*?)<\/span>/);
					if (match1) {
						if (match1[1] !== 'Book') {
							continue;
						}
					} else {
						reject();
						return;
					}
					match1 = match[1].match(/<span class="title">(.*?)<\/span>/);
					if (match1) {
						title = match1[1];
					} else {
						reject();
						return;
					}
					match1 = match[1].match(/<a.*?href="(.*?)".*?class="itemLink">/);
					if (match1) {
						bookUrl = match1[1];
					} else {
						reject();
						return;
					}
					articles.push({
						title         : title,
						description   : "",
						picurl        : "",
						url           : bookUrl
					});
				}
				resolve(articles);
			}
		});
	});
}

module.exports = reading;
