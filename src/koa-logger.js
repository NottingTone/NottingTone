import path from 'path';
import winston from 'winston';

import config from './config';

const logger = new winston.Logger({
	transports: [
		new winston.transports.DailyRotateFile({
			filename: path.join(__dirname, '..', config.log.koa, '.log'),
			datePattern: 'yyyyMMdd',
			level: 'verbose',
			prepend: true,
		}),
		new winston.transports.Console({ level: 'warn' }),
	],
});

export default async (ctx, next) => {
	const start = Date.now();
	const log = {
		level: 'info',
		method: ctx.method,
		url: ctx.href,
		ip: ctx.get('X-Real-IP') || ctx.ip,
	};
	try {
		await next();
		if (ctx.status >= 500) {
			log.level = 'error';
		} else if (ctx.status >= 400) {
			log.level = 'warn';
		}
	} catch (e) {
		if (e.name === 'AssertionError') {
			log.level = 'warn';
			log.message = e.message;
			ctx.status = 400;
			if (process.env.NODE_ENV === 'dev') {
				console.error(e);
			}
		} else {
			log.level = 'error';
			log.message = e.message;
			if (!ctx.headerSent) {
				ctx.status = 500;
			}

		}
	}
	const level = log.level;
	delete log.level;
	log.duration = Date.now() - start;
	log.status = ctx.status;
	logger.log(level, log);
};
