import path from 'path';
import winston from 'winston';
import http from 'http';
import https from 'https';

import config from './config';

const logger = new winston.Logger({
	transports: [
		new winston.transports.DailyRotateFile({
			filename: path.join(__dirname, '..', config.log.http, '.log'),
			datePattern: 'yyyyMMdd',
			level: 'verbose',
			prepend: true,
		}),
		new winston.transports.Console({ level: 'warn' }),
	],
});

function wrap(object, method) {
	const original = object[method];
	object[method] = function (options, callback) {
		const req = original.call(this, options, callback);
		const start = Date.now();
		if (['GET', 'POST'].includes(options.method)) {
			const data = {
				method: options.method,
				url: options.uri.href,
			};
			req.on('error', (err) => {
				logger.log('error', {
					duration: Date.now() - start,
					error: err.message,
					...data,
				});
			});
			req.on('response', (res) => {
				res.on('end', () => {
					logger.log('info', {
						duration: Date.now() - start,
						status: res.statusCode,
						...data,
					});
				});
				res.on('error', (err) => {
					logger.log('error', {
						duration: Date.now() - start,
						error: err.message,
						...data,
					});
				})
			})
		}
		return req;
	}
}

wrap(http, 'request');
