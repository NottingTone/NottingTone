import path from 'path';
import winston from 'winston';

import config from './config';

const logger = new winston.Logger({
	transports: [
		new winston.transports.DailyRotateFile({
			filename: path.join(__dirname, '..', config.log.user, '.log'),
			datePattern: 'yyyyMMdd',
			level: 'verbose',
			prepend: true,
		}),
		new winston.transports.Console({ level: 'warn' }),
	],
});

export default logger;
