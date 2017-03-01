import request from 'request-promise-native';

import config from '../config';
import Cache from '../cache';

const cache = new Cache('wechat_public_account', 'utf-8', async (openid) => {
	const data = await request.get({
		url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${config.wechat.accessToken.token}&openid=${openid}`,
		json: true,
	});
	return data.unionid;
});

export default cache.get.bind(cache);
