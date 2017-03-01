import VueRouter from 'vue-router';

import Timetable from './views/Timetable';

import Modules from './views/modules/Modules';
import ModulesFilter from './views/modules/Filter';
import ModulesModule from './views/modules/Module';
import ModulesActivityType from './views/modules/ActivityType';
import ModulesSeminarGroup from './views/modules/SeminarGroup';
import ModulesActivity from './views/modules/Activity';

import More from './views/More';

const router = new VueRouter({
	routes: [{
		path: '/',
		redirect: '/timetable',
	}, {
		path: '/timetable',
		component: Timetable,
	}, {
		path: '/modules',
		component: Modules,
	}, {
		name: 'filter',
		path: '/modules/filter/:filter',
		component: ModulesFilter,
	}, {
		name: 'module',
		path: '/modules/module/:module',
		component: ModulesModule,
	}, {
		name: 'type',
		path: '/modules/module/:module/:type',
		component: ModulesActivityType,
	}, {
		name: 'group',
		path: '/modules/module/:module/:type/:group',
		component: ModulesSeminarGroup,
	}, {
		name: 'activity',
		path: '/modules/activity/:activity',
		component: ModulesActivity,
	}, {
		path: '/more',
		component: More,
	}],
});

export default router;
