import path from 'path';
import sqlite from 'sqlite';

import config from '../../config';

const dbs = {};

(async () => {
	dbs.unnc = await sqlite.open(path.join(__dirname, '../../..', config.db.timetable_unnc));
	dbs.unuk = await sqlite.open(path.join(__dirname, '../../..', config.db.timetable_unuk));
})();

export default dbs;
