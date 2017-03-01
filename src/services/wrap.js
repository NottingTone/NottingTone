import path from 'path';
import winston from 'winston';
import level from 'level';
import promisify from 'then-levelup';

import config from '../config';

const logger = new winston.Logger({
	transports: [
		new winston.transports.DailyRotateFile({
			filename: path.join(__dirname, '../..', config.log.services, '.log'),
			datePattern: 'yyyyMMdd',
			level: 'verbose',
			prepend: true,
		}),
		new winston.transports.Console({ level: 'warn' }),
	],
});

export default function wrap(func, options) {
	const name = `${options.service}.${options.func}`;
	let cacheStore;
	if (options.cache) {
		const storePath = path.join(__dirname, '../../db/', name);
		cacheStore = promisify(level(storePath, { valueEncoding: 'json' }));
	}
	return async function (...args) {
		const start = Date.now();
		const argMap = {};
		for (const [idx, param] of options.params) {
			argMap[param] = args[idx];
		}
		const log = {
			func: name,
			args: argMap,
			level: 'info',
			message: 'success',
		}
		let ret, incLog;
		if (options.cache) {
			[incLog, ret] = await getCache(cacheStore, argMap[options.cache.key]);
			Object.assign(log, incLog);
		}
		if (ret === undefined) {
			[incLog, ret] = await getDirect(func, args);
			Object.assign(log, incLog);
		}
		if (ret !== undefined && options.cache) {
			await saveCache(cacheStore, argMap[options.cache.key], ret, options.cache.expiration);
		}
		const level = log.level;
		delete log.level;
		log.duration = Date.now() - start;
		return ret;
	}
};

async function getCache(store, key) {
	try {
		const data = await store.get(key);
	} catch (e) {
		return [{ cached: 'miss' }, null];
	}
	if (data.expiration === -1 || data.expiration * 1000 < Date.now()) {
		return [{ cached: 'expired' }, null];
	}
	return [{ cached: 'hit' }, data.data];
}

async function getDirect(func, args) {
	try {
		const ret = await func(...args);
		return [{ message: 'success' }, ret];
	} catch (e) {
		if (e.name === 'AssertionError') {
			return [{ level: 'warn', message: e.message }, null];
		}
		return [{ level: 'error', message: e.message }, null];
	}
}

async function saveCache(store, key, data, expiration) {
	await store.put(key, {
		data,
		expiration: expiration === -1 ? -1 : parseInt(Date.now() / 1000) + expiration,
	});
}
