import wrap from '../wrap';
import { fetchCardByStuId, fetchCardByStuIdName } from './fetch';

export const getCardByStuId = wrap(fetchCardByStuId, {
	service: 'card',
	func: 'getCardByStuId',
	params: ['stuId'],
	cache: {
		key: 'stuId',
		expiration: 20,
	},
});

export const getCardByStuIdName = wrap(fetchCardByStuIdName, {
	service: 'card',
	func: 'getCardByStuIdName',
	params: ['stuId', 'stuName'],
});
