import { assert	} from 'chai';
import request from 'request-promise-native';
import moment from 'moment';

import dbs from './db';
import { mergeSettings } from './settings';
import wrap from '../wrap';
import config from '../../config';

export async function getDataByFilters(settings, filters) {
	const processor = new FilterProcessor(mergeSettings(settings));
	return await processor.getDataByFilters(filters, false);
}

export async function getActiveData(settings, filters, select) {
	const processor = new FilterProcessor(mergeSettings(settings));
	return await processor.getActiveData(filters, select);
};

class FilterProcessor {
	constructor(settings) {
		this.settings = settings;
		this.db = dbs[settings.campus];
		this.activities = new Map();
	}

	async getDataByFilters(filters, activeOnly) {
		const ret = {
			filters: [],
		};
		const activityIds = [];
		for (const filter of filters) {
			const activities = await this.getActivityIdsByFilter(filter);
			const filterInfo = await this.getFilterInfoByFilter(filter);
			activityIds.push(...activities);
			ret.filters.push({
				activities,
				...filter,
				...filterInfo,
			});
		}
		const moduleIds = await this.getModuleIdsByActivityIds(new Set(activityIds));
		ret.modules = await this.getModulesByIds(new Set(moduleIds));
		if (activeOnly) {
			ret.activities = await this.getActivitiesByIds(new Set(activityIds));
		} else {
			ret.activities = [...this.activities.values()];
		}
		return ret;
	}

	async getActiveData(filters, select) {
		const data = await this.getDataByFilters(filters, true);
		const activities = new Map();
		const allActivities = new Map();
		for (const [id, activity] of data.activities.entries()) {
			activities.set(activity.id, {
				...activity,
				weeks: new Set(activity.weeks),
			});
			allActivities.set(activity.id, {
				...activity,
				weeks: new Set(activity.weeks),
			});
		}
		const extraActivityIds = new Set();
		for (const [object, set] of Object.entries(select)) {
			const [activityId, week] = object.split('/').map(x => parseInt(x));
			if (set === 1 && !allActivities.has(activityId)) {
				extraActivityIds.add(activityId);
			}
		}
		const extraActivities = await this.getActivitiesByIds(new Set(extraActivityIds.keys()));
		for (const extraActivity of extraActivities) {
			activities.set(extraActivity.id, extraActivity);
		}

		for (const [object, set] of Object.entries(select)) {
			const [activityId, week] = object.split('/').map(x => parseInt(x));
			if (!week) {
				if (set === 1) {
					const activity = allActivities.get(activityId);
					activities.set(activityId, {
						...activity,
						weeks: new Set(activity.weeks),
					});
				} else if (activities.has(activityId)) {
					activities.delete(activityId);
				}
			}
		}

		for (const [object, set] of Object.entries(select)) {
			const [activityId, week] = object.split('/').map(x => parseInt(x));
			if (week) {
				if (set === 1) {
					if (!activities.has(activityId)) {
						const activity = allActivities.get(activityId);
						activities.set(activityId, {
							...activity,
							weeks: new Set(),
						});
					}
					activities.get(activityId).weeks.add(week);
				} else if (activities.has(activityId)) {
					activities.get(activityId).weeks.delete(week);
				}
			}
		}

		for (const [id, activity] of activities) {
			if (activity.weeks.size === 0) {
				activities.delete(id);
			}
		}
		return {
			...data,
			activities: [...activities.values()],
		};
	}

	async getModuleIdsByActivityIds(activityIds) {
		const ret = [];
		for (const activityId of activityIds) {
			let moduleIds;
			if (activityId.toString().startsWith('9999999')) {
				const id = parseInt(activityId.toString().slice(7));
				moduleIds = await this.db.all('SELECT module_id FROM exams WHERE id=?', [id]);
			} else {
				moduleIds = await this.db.all('SELECT module_id FROM module_activity WHERE activity_id=?', [activityId]);
			}
			ret.push(...moduleIds.map(x => x.module_id));
		}
		return ret;
	}

	async getModulesByIds(moduleIds) {
		const rets = [];
		for (const moduleId of moduleIds) {
			const module_ = await this.db.get('SELECT * FROM modules WHERE id=?', [moduleId]);
			const activityIds = await this.db.all('SELECT activity_id, `group` FROM module_activity WHERE module_id=?', [moduleId]);
			const activities = await this.getActivitiesByIds(activityIds.map(x => x.activity_id));
			for (const [idx, activity] of activities.entries()) {
				Object.assign(activity, {
					group: activityIds[idx].group,
				});
			}
			const examIds = await this.db.all('SELECT id FROM exams WHERE module_id=?', [moduleId]);
			const exams = await this.getActivitiesByIds(examIds.map(x => parseInt(`9999999${x.id}`)));
			activities.push(...exams);
			const classifiedActivities = classify(activities, 'type');
			for (const type_ of Object.keys(classifiedActivities)) {
				classifiedActivities[type_] = classify(classifiedActivities[type_], 'group', true);
			}
			rets.push({
				id: module_.id,
				code: module_.code,
				name: module_.name,
				types: classifiedActivities,
			});
		}
		return rets;
	}

	async getActivitiesByIds(activityIds) {
		const ret = [];
		for (const activityId of activityIds) {
			if (activityId.toString().startsWith('9999999')) {
				ret.push(await this.getExamActivityById(activityId));
			} else {
				ret.push(await this.getActivityById(activityId));
			}
		}
		return ret;
	}

	async getActivityById(activityId) {
		if (this.activities.has(activityId)) {
			return this.activities.get(activityId);
		}
		const activity = await this.db.get('SELECT * FROM activities WHERE id=?', [activityId]);
		const rooms = await this.db.all(
			'SELECT * FROM rooms INNER JOIN room_activity ON rooms.id=room_activity.room_id WHERE activity_id=?',
			[activityId],
		);
		const staffs = await this.db.all(
			'SELECT * FROM staffs INNER JOIN staff_activity ON staffs.id=staff_activity.staff_id WHERE activity_id=?',
			[activityId],
		);
		const ret = {
			id: activity.id,
			code: activity.code,
			type: activity.type,
			day: activity.day,
			start: activity.start,
			end: activity.end,
			weeks: activity.weeks.split(',').map(x => parseInt(x)),
			rooms: rooms.map(x => ({
				name: x.name,
				alias: x.alias,
			})),
			staffs: staffs.map(x => x.name),
		};
		this.activities.set(activityId, ret);
		return ret;
	}

	async getExamActivityById(activityId) {
		const examId = parseInt(activityId.toString().slice(7));
		if (this.activities.has(activityId)) {
			return this.activities.get(activityId);
		}
		const exam = await this.db.get('SELECT * FROM exams WHERE id=?', [examId]);
		const room = await this.db.get('SELECT * FROM rooms WHERE id=?', [exam.room_id]);
		const sun0 = moment(config.tomatotabling[this.settings.campus].week0).day('Sun');
		const date = moment(exam.date);
		const ret = {
			id: activityId,
			code: exam.group,
			type: 'Exam',
			day: date.format('dddd'),
			start: exam.start,
			end: exam.end,
			weeks: [date.diff(sun0, 'week')],
			group: exam.group,
			rooms: [{
				name: room.name,
				alias: room.alias,
			}],
			staffs: [],
		};
		this.activities.set(activityId, ret);
		return ret;
	}

	async getFilterInfoByFilter(filter) {
		let rows;
		switch (filter.type) {
		case 'y1group':
			return this.db.get('SELECT name FROM y1groups WHERE id=?', [filter.id]);
		case 'module':
			return this.db.get('SELECT code, name FROM modules WHERE id=?', [filter.id]);
		case 'staff':
			return this.db.get('SELECT name FROM staffs WHERE id=?', [filter.id]);
		case 'program':
			return this.db.get('SELECT id, name FROM programs WHERE id=?', [filter.id]);
		case 'room':
			return this.db.get('SELECT name, alias FROM rooms WHERE id=?', [filter.id]);
		case 'exam':
			return {};
		case 'student':
			return {};
		default:
			assert(false, 'INVALID_FILTER_TYPE');
		}
	}

	async getActivityIdsByFilter(filter) {
		let sql;
		switch (filter.type) {
		case 'y1group':
			sql = 'SELECT activity_id FROM y1group_activity WHERE y1group_id=?';
			return await this.getActivityIdsBySql(sql, [filter.id]);
		case 'module':
			sql = 'SELECT activity_id FROM module_activity WHERE module_id=?';
			return await this.getActivityIdsBySql(sql, [filter.id]);
		case 'staff':
			sql = 'SELECT activity_id FROM staff_activity WHERE staff_id=?';
			return await this.getActivityIdsBySql(sql, [filter.id]);
		case 'program':
			sql = 'SELECT activity_id FROM program_activity WHERE program_id=?';
			return await this.getActivityIdsBySql(sql, [filter.id]);
		case 'room':
			sql = 'SELECT activity_id FROM room_activity WHERE room_id=?';
			return await this.getActivityIdsBySql(sql, [filter.id]);
		case 'exam':
			sql = 'SELECT exam_id FROM student_exam WHERE student_id=?';
			const exams = await this.db.all(sql, [filter.id]);
			return exams.map(x => parseInt(`9999999${x.exam_id}`));
		case 'student':
			return await this.getActivityIdsByStuId(filter.id);
		default:
			assert(false, 'INVALID_FILTER_TYPE');
		}
	}

	async getActivityIdsByStuId(stuId) {
		return await getActivityIdsByStuId(`${this.settings.campus}_${stuId}`);
	}

	async getActivityIdsBySql(sql, params) {
		const activities = await this.db.all(sql, params);
		return activities.map(x => x.activity_id);
	}
}

function classify(objects, key, onlyId=false) {
	const ret = {};
	for (const object of objects) {
		if (ret[object[key]]) {
			ret[object[key]].push(onlyId ? object.id : object);
		} else {
			ret[object[key]] = [onlyId ? object.id : object];
		}
	}
	return ret;
}

async function fetchActivityIdsByStuId_(stuInfo) {
	const [campus, stuId] = stuInfo.split('_');
	const url = `${config.scientia[campus]}/reporting/Individual;Student+Sets;id;${stuId}?template=Student+Set+Individual&weeks=${config.tomatotabling[campus].semester}&days=1-7&periods=1-32`;
	assert(url, 'INVALID_CAMPUS');
	let html;
	try {
		html = await request.get(url);
	} catch (e) {
		return [];
		// assert(false, 'ERROR_FETCHING_TIMETABLE');
	}
	const patternObject = /<!-- START OBJECT-CELL -->([\s\S]*?)<!-- END OBJECT-CELL -->/g;
	let object;
	const ret = [];
	while ((object = patternObject.exec(html))) {
		const match = object[1].match(/<font color='#000000'>([\s\S]*?)<\/font>/);
		const code = match[1];
		const activities = await dbs[campus].all('SELECT id FROM activities WHERE code=?', [code]);
		if (!activities.length) {
			// TODO: warning activity not found
		}
		ret.push(...activities.map(x => x.id));
	}
	return ret;
}

const getActivityIdsByStuId = wrap(fetchActivityIdsByStuId_, {
	service: 'timetable',
	func: 'getActivityIdsByStuId',
	params: ['campus_stuId'],
	cache: {
		ttl: 86400,
		key: 'campus_stuId',
	},
});
