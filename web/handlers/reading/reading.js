"use strict";

var request = require('request');
var iconv = require('iconv').Iconv;

var gbk2utf8 = new iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');

function reading () {
	if (!this.user.courseId) {
		this.handOver('REQUIRE_COURSE');
	} else {
		// do stuff
		
		var _this = this;
		getCourse('unnc',this.user.courseId)
		.then(function (data) {
			if (data == 0) {
				return getCourse('unuk',this.user.courseId);
			} else {
				return data;
			}
		})
		.then(function (data) {
			if (data == 0) {
				_this.sendTemplateResponse('unsupportedReadinglist2');
			} else {
				return getCourseReadingList(data);
			}
		}).then(function (data) {
			if (data == 0) {
				_this.sendTemplateResponse('unsupportedReadinglist1');
			} else {
				_this.sendTemplateResponse('base/news',data);
			}
			
		}).then(null, function (err) {
			_this.sendTemplateResponse('exception');
		})
	}
}

module.exports = reading;


function getCourse (area, courseId) {
	return new Promise (function (resolve, reject) {
		
		var url = {
			'unnc': 'http://readinglists.nottingham.edu.cn/search.html?q=' ,
			'unuk':  'http://readinglists.nottingham.ac.uk/search.html?q='
		}[area] + this.user.courseId.toUpperCase();
		
		var moduleUrl = "";
		var module = "";
		
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var match = body.match(/<li[^>]*class="decimal"[^>]*>([\s\S]*?)<\/li>/g);
				if(match){
					match.forEach(function(course){
						var tempMatch = course.match(/(2015\/2016)/);
						if(tempMatch){
							module = course;
						}
					})
					if(moduleUrl == "") {
						resolve(0);
					} else {
						var moduleUrlMatch = module.match(/<a([\s\S]*?)href=\'([\s\S]*?)\'([\s\S]*?)>([\s\S]*?)<\/a>/);
						moduleUrl = moduleUrlMatch[2];
						resolve(moduleUrl);
					}
				} else {
					resolve(0);
				}
				
				
			} else {
				reject();
			}
		});	
	});
}

function getCourseReadingList (courseUrl) {
	return new Promise (function (resolve, reject) {
		var url = courseUrl;
		var article = {};
		var articleArray = [];
		
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var urlMatch = body.match(/CONTEXT.page.requestUri = "([\s\S]*?)"/si);
				var readinglistUrl = urlMatch[1];
				
				var titleMatch = body.match(/<h1 id="pageTitle"([\s\S]*?)>([\s\S]*?) <span>/);
				var title = titleMatch[2];
				
				article.title = title;
				article.description = "";
				article.picUrl = "http://unnctimetable.com/images/library.jpg";
				article.url = readinglistUrl;
				
				articleArray.push(article);
				
				var readinglistMatch = body.match(/<li class="item"([\s\S]*?)>([\s\S]*?)<\/li>/g);
				
				var bookCounter = 0;
				readinglistMatch.forEach(function(book){
					var bookMatch = book.match(/<span class="title">([\s\S]*?)<\/span>/);
					var bookTitle = bookMatch[1];
					bookMatch = book.match(/<a([\s\S]*?)href="([\s\S]*?)"([\s\S]*?)>/)
					var bookUrl = bookMatch[2];
					bookMatch = book.match(/<span([\s\S]*?)class=\'resourceType label\'([\s\S]*?)>([\s\S]*?)<\/span>/);
					var bookLabel = bookMatch[3];
					
					if(bookLabel == "Book" && bookCounter < 9)
					{
						bookCounter += 1;
						article = {};
						article.title = bookTitle;
						article.description = "";
						article.picUrl = "http://unnctimetable.com/images/book.jpg";
						article.url = bookUrl;
						
						articleArray.push(article);
					} else if (bookCounter == 9){
						bookCounter += 1;
						article = {};
						article.title = "查看更多";
						article.description = "";
						article.picUrl = "http://unnctimetable.com/images/book.jpg";
						article.url = readinglistUrl;
						articleArray.push(article);
					}
						
				});
				
				resolve(articleArray);
				
			} else {
				reject();
			}
		
		});
	});
}
