import { assert } from 'chai';

import dbs from './db';
import { mergeSettings } from './settings';

export async function search(settings, type, key) {
	settings = mergeSettings(settings);
	const db = dbs[settings.campus];
	assert(db, 'INVALID_CAMPUS');
	switch (type) {
	case 'module': {
		assert(key.length >= 3 && key.length <= 100, 'INVALID_KEY_LENGTH');
		let modules;
		if (/^[A-Z0-9]{3,8}$/i.test(key)) {
			const sql = 'SELECT * FROM modules WHERE INSTR(lower(code_search),lower(?))<>0 OR INSTR(lower(name),lower(?))<>0 LIMIT 20';
			modules = await db.all(sql, [key, key]);
		} else {
			const sql = 'SELECT * FROM modules WHERE INSTR(lower(name),lower(?))<>0 LIMIT 20';
			modules = await db.all(sql, [key]);
		}
		return modules.map(x => ({
			id: x.id,
			code: x.code,
			name: x.name,
		}));
	}
	case 'y1group': {
		assert(key.length >= 1 && key.length < 15, 'INVALID_KEY_LENGTH');
		const significant = key.replace(/[^A-Z0-9]/i, '');
		const y1groups = await db.all('SELECT * FROM y1groups WHERE INSTR(lower(key),lower(?))<>0 LIMIT 20', [significant]);
		return y1groups.map(x => ({
			id: x.id,
			name: x.name,
		}));
	}
	case 'staff': {
		assert(key.length >= 3 && key.length <= 100, 'INVALID_KEY_LENGTH');
		const staffs = await db.all('SELECT * FROM staffs WHERE INSTR(lower(name),lower(?))<>0 LIMIT 20', [key]);
		return staffs.map(x => ({
			id: x.id,
			name: x.name,
		}));
	}
	case 'program': {
		assert(key.length >= 1 && key.length <= 100, 'INVALID_KEY_LENGTH');
		const sql ='SELECT * FROM programs WHERE INSTR(lower(name),lower(?))<>0 LIMIT 20';
		const programs = await db.all(sql, [key]);
		return programs.map(x => ({
			id: x.id,
			name: x.name,
		}));
	}
	case 'room':
		assert(key.length >= 2 && key.length <= 20, 'INVALID_KEY_LENGTH');
		const rooms = await db.all('SELECT * FROM rooms WHERE INSTR(lower(name),lower(?)) OR INSTR(lower(alias),lower(?)) LIMIT 20', [key, key]);
		return rooms.map(x => ({
			id: x.id,
			name: x.name,
			alias: x.alias,
		}));
	default:
		assert(false, 'INVALID_TYPE');
	}
}
