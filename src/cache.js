import path from 'path';
import level from 'level';
import promisify from 'then-levelup';
import config from './config';

export default class Cache {
	constructor(dbName, encoding, fetch, expiration = -1) {
		const dbPath = path.join(__dirname, '..', config.db[dbName]);
		const db = promisify(level(dbPath, {
			valueEncoding: expiration < 0 ? encoding : 'json',
		}));
		Object.assign(this, {
			fetch,
			db,
			expiration,
		});
	}
	async get(key) {
		try {
			const data = await this.db.get(key);
			if (this.expiration < 0) {
				return data;
			}
			if (data.expiration * 1000 < Date.now()) {
				throw new Error('cache expired');
			}
			return data.value;
		} catch (e) {
			const value = await this.fetch(key);
			if (this.expiration < 0) {
				await this.db.put(key, value);
			} else {
				await this.db.put(key, {
					value,
					expiration: Math.floor(Date.now() / 1000) + this.expiration,
				});
			}
			return value;
		}
	}
};
