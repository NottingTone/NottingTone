import { assert } from 'chai';
import request from 'request-promise-native';

import { getDorms, getBuildings } from './dorms';

export async function fetchElectricity(dorm) {
	const dorms = await getDorms();
	const roomCode = dorms[dorm];
	assert(roomCode, 'ROOM_NOT_FOUND');
	const building = dorm.split('-')[0];
	const buildings = await getBuildings();
	const buildingCode = buildings[building];
	assert(buildingCode, 'BUILDING_NOT_FOUND');
	const html = await request.post({
		url: 'http://wxschool.lsmart.cn/electric/electric_goAmount.shtml',
		form: {
			openId: '0',
			wxArea: '16301',
			areaNo: '001',
			buildNo: buildingCode,
			roomNo: roomCode,
		},
	});
	const match = html.match(/<div class="w_n_lis2">\s*<h2>剩余量<\/h2>\s*<p>\s*(\S*)\s*<\/p>\s*<div class="cl"><\/div>\s*<\/div>/);
	assert(match, 'ERROR_PARSING_SERVER_RESPONSE');
	return parseFloat(match[1]);
}
