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
	await next();
	let level = 'info';
	if (ctx.status >= 500) {
		level = 'error';
	} else if (ctx.status >= 400) {
		level = 'warn';
	}
	logger.log(level, {
		method: ctx.method,
		url: ctx.href,
		status: ctx.status,
		duration: Date.now() - start,
		ip: ctx.get('X-Real-IP') || ctx.ip,		// trust 1 proxy
	});
};
