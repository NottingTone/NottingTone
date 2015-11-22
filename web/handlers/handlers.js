"use strict";

var handlers = {
	ROUTER            : require('./router/router'),
	QUERY_TIMETABLE   : require('./timetable/timetable'),
	QUERY_COAL        : require('./coal/coal'),
	QUERY_EXERCISE    : require('./exercise/exercise'),
	QUERY_READING     : require('./reading/reading'),
	QUERY_UNBIND      : require('./unbind/unbind'),
	TONE_PODCAST      : require('./simpleNews/simpleNews'),
	TONE_PHOTO        : require('./simpleNews/simpleNews'),
	//TONE_VIDEO        : require('./video/video'),
	//TONE_COUPON       : require('./coupon/coupon')
	ABOUT_TEAM        : require('./simpleNews/simpleNews'),
	ABOUT_CONTACT     : require('./simpleNews/simpleNews'),
	ABOUT_BELIEF      : require('./simpleNews/simpleNews'),
	REQUIRE_STUID     : require('./input/stuId').requireStuId,
	INPUT_STUID       : require('./input/stuId').inputStuId,
	REQUIRE_DORM      : require('./input/dorm').requireDorm,
	INPUT_DORM        : require('./input/dorm').inputDorm,
	REQUIRE_COURSE    : require('./input/course').requireCourse,
	INPUT_COURSE      : require('./input/course').inputCourse,
	REQUIRE_SUBGROUP  : require('./input/timetable').requireSubGroup,
	INPUT_SUBGROUP    : require('./input/timetable').inputSubGroup
};

module.exports = handlers;
