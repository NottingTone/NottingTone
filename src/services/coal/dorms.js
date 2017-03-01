import request from 'request-promise-native';
import fs from 'mz/fs';
import path from 'path';

import config from '../../config';

let dorms = null;
let buildings = null;

export async function fetchDorms() {
	const body = await request.post({
		url: 'http://wxschool.lsmart.cn/electric/electric_queryRoom.shtml',
		json: true,
		form: {
			areaNo: '001',
			wxArea: '16301',
		},
	});
	const dorms = {};
	for (const dorm of body) {
		dorms[dorm.name] = dorm.code;
	}
	return dorms;
}

export async function fetchBuildings() {
	const body = await request.post({
		url: 'http://wxschool.lsmart.cn/electric/electric_queryBuild.shtml',
		json: true,
		form: {
			areaNo: '001',
			wxArea: '16301',
		},
	});
	const buildings = {};
	for (const building of body) {
		const name = building.name.match(/诺丁汉(\d+)幢/)[1];
		buildings[name] = building.code;
	}
	return buildings;
}

export async function getDorms() {
	if (dorms) {
		return dorms;
	}
	const dbPath = path.join(__dirname, '../../..', config.db.dorms);
	try {
		const content = await fs.readFile(dbPath, { encoding: 'utf-8' });
		dorms = JSON.parse(content);
		return dorms;
	} catch (e) {
		dorms = await fetchDorms();
		await fs.writeFile(dbPath, JSON.stringify(dorms), { encoding: 'utf-8' });
		return dorms;
	}
}

export async function getBuildings() {
	if (buildings) {
		return buildings;
	}
	const dbPath = path.join(__dirname, '../../..', config.db.buildings);
	try {
		const content = await fs.readFile(dbPath, { encoding: 'utf-8' });
		buildings = JSON.parse(content);
		return buildings;
	} catch (e) {
		buildings = await fetchBuildings();
		await fs.writeFile(dbPath, JSON.stringify(buildings), { encoding: 'utf-8' });
		return buildings;
	}
}
