var router = require('express').Router();

var timetable = require('../handlers/timetable/router');

router.use('/timetable', timetable);

module.exports = router;
