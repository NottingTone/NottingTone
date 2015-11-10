"use strict";

var handlers = {
	ROUTER            : require('./router/router'),
	QUERY_TIMETABLE   : require('./timetable/timetable'),
	QUERY_COAL        : require('./coal/coal'),
	QUERY_EXERCISE    : require('./exercise/exercise'),
	QUERY_READING     : require('./reading/reading'),
	QUERY_UNBIND      : require('./unbind/unbind'),
	//TONE_PODCAST      : require('./podcast/podcast'),
	//TONE_PHOTO        : require('./photo/photo'),
	//TONE_VIDEO        : require('./video/video'),
	//TONE_COUPON       : require('./coupon/coupon')
	//ABOUT_TEAM        : require('./team/team'),
	//ABOUT_CONTACT     : require('./contact/contact'),
	//ABOUT_BELIEF      : require('./belief/belief')
	REQUIRE_STUID     : require('./input/stuId').requireStuId,
	INPUT_STUID       : require('./input/stuId').inputStuId,
	REQUIRE_DORM      : require('./input/dorm').requireDorm,
	INPUT_DORM        : require('./input/dorm').inputDorm
	//REQUIRE_COURSE    : require('./input/courseId').requireCourse,
	//INPUT_COURSE      : require('./input/courseId').inputCourse
};

module.exports = handlers;
