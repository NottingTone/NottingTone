import path from 'path';
import level from 'level';
import levelStore from 'koa-level';
import session from 'koa-generic-session';
import convert from 'koa-convert';

import config from '../../config';

const sessionStore = level(path.join(__dirname, '../../..', config.db.tomatotabling_session));

const middleware = convert(session({
	key: 'tomatotabling',
	store: levelStore({
		db: sessionStore,
	}),
}));

export default middleware;
