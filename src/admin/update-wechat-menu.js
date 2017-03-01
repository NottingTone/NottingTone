import path from 'path';
import fs from 'mz/fs';
import request from 'request-promise-native';

import config from '../config';

export default async function updateWechatMenu(ctx) {
	if (!ctx.get('X-Real-IP') && /(::ffff:)?127\.0\.0\.1/.test(ctx.ip)) {
		const menu = JSON.parse(await fs.readFile(path.join(__dirname, '../../menu.json'), { encoding: 'utf-8' }));
		ctx.type = 'json';
		ctx.body = await request.post({
			url: `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${config.wechat.accessToken.token}`,
			form: JSON.stringify(menu),
			json: true,
		});
	}
}
