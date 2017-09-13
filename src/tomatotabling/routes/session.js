import path from 'path';
import { assert } from 'chai';
import level from 'level';
import ttl from 'level-ttl';
import session from 'koa-generic-session';

import config from '../../config';

const sessionStore = {
	db: ttl(level(path.join(__dirname, '../../..', config.db.tomatotabling_session))),
	async get(sid) {
		try {
			return JSON.parse(await this.db.get(sid));
		} catch (e) {
			return {};
		}
	},
	async set(sid, sess, ttl) {
		await this.db.put(sid, JSON.stringify(sess), ttl ? { ttl } : {});
	},
	async destroy(sid) {
		await this.db.del(sid);
	},
};

const middleware = session({
	key: 'tomatotabling',
	store: sessionStore,
	ttl: 60 * 60 * 1000,
});

export default middleware;
