import Vue from 'vue';
import moment from 'moment';

const select = {
	setType(state, moduleId, type) {
		for (const group of Object.keys(dataStore.modules.get(moduleId).types[type])) {
			this.setGroup(state, moduleId, type, group);
		}
	},
	setGroup(state, moduleId, type, group) {
		for (const activityId of dataStore.modules.get(moduleId).types[type][group]) {
			this.setActivity(state, activityId);
		}
	},
	setActivity(state, activityId) {
		this.set(state, `${activityId}`);
		for (const week of dataStore.activities.get(activityId).weeks) {
			this.setClass(-1, activityId, week);
		}
	},
	setClass(state, activityId, week) {
		this.set(state, `${activityId}/${week}`);
	},
	getClass(activityId, week){
		const set = this.data.get(`${activityId}/${week}`);
		if (set !== undefined) {
			return set;
		}
		return null;
	},
	getActivity(activityId) {
		const activitySet = this._getActivity(activityId);
		const activity = dataStore.activities.get(activityId);
		let set = null;
		for (const week of activity.weeks) {
			const classSet = this.getClass(activityId, week);
			const thisSet = classSet === null ? activitySet : classSet;
			if (set === null) {
				set = thisSet;
			} else if (set !== thisSet) {
				return -1;
			}
		}
		return set;
	},
	// only about activity itself, regardless the status of classes
	_getActivity(activityId) {
		const set = this.data.get(`${activityId}`);
		if (set !== undefined) {
			return set;
		}
		for (const filter of dataStore.filters) {
			if (filter.activities.includes(activityId)) {
				return 1;
			}
		}
		return 0;
	},
	getGroup(moduleId, type, group) {
		const activityIds = dataStore.modules
			.get(moduleId)
			.types[type][group];
		let set = null;
		for (const activityId of activityIds) {
			const activitySet = this.getActivity(activityId);
			if (activitySet === -1) {
				return -1;
			} else if (set === null) {
				set = activitySet;
			} else if (set !== activitySet) {
				return -1;
			}
		}
		return set;
	},
	getType(moduleId, type) {
		const groups = dataStore.modules
			.get(moduleId)
			.types[type];
		let set = null;
		for (const group of Object.keys(groups)) {
			const groupSet = this.getGroup(moduleId, type, group);
			if (groupSet === -1) {
				return -1;
			} else if (set === null) {
				set = groupSet;
			} else if (set !== groupSet) {
				return -1;
			}
		}
		return set;
	},
	// -1 will be treated as 1
	getModule(moduleId) {
		const types = dataStore.modules.get(moduleId).types;
		for (const type_ of Object.keys(types)) {
			if (this.getType(moduleId, type_) !== 0) {
				return 1;
			}
		}
		return 0;
	},
	// remove selections on modules that are no longer references by any filters
	unsetFilter(idx) {
		const filter = dataStore.filters[idx];
		const referencedActivityIds = new Set();
		for (const [otherIdx, otherFilter] of dataStore.filters.entries()) {
			if (otherIdx !== idx) {
				for (const activityId of otherFilter.activities) {
					referencedActivityIds.add(activityId);
				}
			}
		}
		const referencedModuleIds = new Set(dataStore.getModuleIdsByActivityIds(referencedActivityIds));
		const referencedModuleActivityIds = new Set(dataStore.getActivityIdsByModuleIds(referencedModuleIds));
		for (const [key, value] of this.data.entries()) {
			if (!referencedModuleActivityIds.has(parseInt(key.split('/')[0]))) {
				this.set(-1, key);
			}
		}
	},
	set(state, object) {
		if (object === 'type') {
			throw new Error();
		}
		const current = this.data.get(object);
		let changed = true;
		if (current !== undefined && state === -1) {
			this.data.delete(object);
		} else if (state !== current && state !== -1) {
			this.data.set(object, state);
		} else {
			changed = false;
		}
		if (changed) {
			this.journal[object] = state;
		}
	},
	commit() {
		this.timer = null;
		return Vue.http.patch('select', { select: this.journal })
			.then(() => {
				this.journal = {};
			});
	},
	deferCommit() {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(() => this.commit(), 1000);
	},
	journal: {},
	timer: null,
	data: new Map(),
};

const dataStore = {
	fetch() {
		return this._Vue.http.get('my').then((resp) => {
			this._fetched = true;
			this.update(resp.data);
			return Promise.resolve(this);
		});
	},
	get() {
		if (this._fetched) {
			return Promise.resolve(this);
		} else if (this._fetching) {
			return this._fetching;
		} else {
			return this._fetching = this.fetch();
		}
	},
	update(data) {
		if (data.filters) {
			// array or object
			for (const [idx, filter] of Object.entries(data.filters)) {
				this.filters[idx] = filter;
			}
		}
		if (data.modules) {
			for (const module_ of data.modules) {
				this.modules.set(module_.id, module_);
			}
		}
		if (data.activities) {
			for (const activity of data.activities) {
				this.activities.set(activity.id, activity);
			}
		}
		if (data.settings) {
			this.settings = data.settings;
		}
		if (data.week0) {
			for (const campus of Object.keys(data.week0)) {
				data.week0[campus] = moment(data.week0[campus]).day('Sun');
			}
			this.week0 = data.week0;
		}
		if (data.semester) {
			for (const campus of Object.keys(data.semester)) {
				data.semester[campus] = data.semester[campus].split('-').map(x => parseInt(x));
			}
			this.semester = data.semester;
		}
		if (data.uid) {
			this.uid = data.uid;
		}
		if (data.select) {
			this.select.data = new Map(Object.entries(data.select));
		}
	},
	findFilter(filter) {
		for (const [existentIdx, existentFilter] of this.filters.entries()) {
			if (filter.type === existentFilter.type && filter.id === existentFilter.id) {
				return existentIdx;
			}
		}
		return -1;
	},
	getModuleIdsByFilterIdx(idx) {
		const activityIds = this.filters[idx].activities;
		return this.getModuleIdsByActivityIds(activityIds);
	},
	getModuleIdsByActivityIds(activityIds) {
		const ret = [];
		for (const module of this.modules.values()) {
			let found = false;
			for (const type_ of Object.keys(module.types)) {
				for (const group of Object.keys(module.types[type_])) {
					for (const activityId of activityIds) {
						if (module.types[type_][group].includes(activityId)) {
							ret.push(module.id);
							found = true;
							break;
						}
					}
					if (found) break;
				}
				if (found) break;
			}
		}
		return ret;
	},
	getActivityIdsByModuleIds(moduleIds) {
		const ret = [];
		for (const moduleId of moduleIds) {
			const module = this.modules.get(moduleId);
			for (const type_ of Object.values(module.types)) {
				for (const group of Object.values(type_)) {
					for (const activity of group) {
						ret.push(activity);
					}
				}
			}
		}
		return ret;
	},
	clear() {
		this.filters = [];
		this.modules = new Map();
		this.activities = new Map();
		this.select.data = new Map();
	},
	filters: [],
	modules: new Map(),
	activities: new Map(),
	settings: {},
	week0: {},
	uid: '',
	select,
};

export default {
	install(Vue, options) {
		dataStore._Vue = Vue;
		Vue.prototype.$timetable = dataStore;
	},
};
