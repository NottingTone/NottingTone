import wrap from '../wrap';
import { fetchElectricity } from './fetch';
import { getDorms as getDorms_ } from './dorms';

export const getElectricity = wrap(fetchElectricity, {
	service: 'coal',
	func: 'getElectricity',
	params: ['dorm'],
	cache: {
		expiration: 60,
		key: 'dorm',
	},
});

export const getDorms = wrap(getDorms_, {
	service: 'coal',
	func: 'getDorms',
	params: [],
});
