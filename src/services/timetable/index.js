import wrap from '../wrap';

import { getDataByFilters as getDataByFilters_, getActiveData as getActiveData_ } from './filters';
import { search as search_ } from './search';

export const getDataByFilters = wrap(getDataByFilters_, {
	service: 'timetable',
	func: 'getDataByFilters',
	params: ['settings', 'filters'],
});

export const getActiveData = wrap(getActiveData_, {
	service: 'timetable',
	func: 'getActiveData',
	params: ['settings', 'filters', 'select'],
});

export const search = wrap(search_, {
	service: 'timetable',
	func: 'search',
	params: ['settings', 'type', 'key'],
});
