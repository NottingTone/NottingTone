import wrap from '../wrap';
import { fetchOverview, fetchAllRecords } from './fetch';

export const getOverview = wrap(fetchOverview, {
	service: 'exercise',
	func: 'getOverview',
	params: ['stuId'],
	cache: {
		expiration: 43200,
		key: 'stuId',
	},
});

export const getAllRecords = wrap(fetchAllRecords, {
	service: 'exercise',
	func: 'getAllRecords',
	params: ['stuId'],
});
