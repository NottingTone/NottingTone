import path from 'path';
import fs from 'mz/fs';

import config from '../config';

export async function saveConfig() {
	const configPath = path.join(__dirname, '../config.json');
	await fs.writeFile(configPath, JSON.stringify(config, null, '\t'), { encoding: 'utf-8' });
}

export default config;
