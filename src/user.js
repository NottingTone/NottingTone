import path from 'path';
import level from 'level';
import promisify from 'then-levelup';
import { assert } from 'chai';

import config from './config';

const dbPath = path.join(__dirname, '..', config.db.users);

const db = promisify(level(dbPath, { valueEncoding: 'json' }));

class User {
	constructor(id) {
		Object.assign(this, {
			id,
		});
	}
	async load(createIfNotExist) {
		try {
			this.data = await db.get(this.id);
		} catch (e) {
			assert(createIfNotExist, 'USER_NOT_FOUND');
			this.data = {};
		}
		this.info = {
			lang: 'en',
			...this.data.info,
		};

		if (this.data.context && this.data.context.expiration * 1000 > Date.now()) {
			this.context = this.data.context.data;
		} else {
			this.context = {
				handlers: [],
				interrupt: 'NORMAL',
				restore: false,
				repeated: false,
				last: 0,
			};
		}
	}
	async save(contextTimeout) {
		const context = contextTimeout === undefined ? this.data.context : {
			data: Object.assign({}, this.context, { last: parseInt(Date.now() / 1000) }),
			expiration: parseInt(Date.now() / 1000) + contextTimeout,
		};
		const data = {
			info: this.info,
			context,
		};
		await db.put(this.id, data);
	}
};

export default async function getUser(id, createIfNotExist=true) {
	const user = new User(id);
	await user.load(createIfNotExist);
	return user;
};
