import request from 'request-promise-native';

import config, { saveConfig } from '../config';

export async function refreshToken() {
	const body = await request.get({
		url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appid}&secret=${config.wechat.appsecret}`,
		json: true,
	});
	if (body.access_token) {
		config.wechat.accessToken = {
			token: body.access_token,
			expiration: parseInt(Date.now() / 1000) + body.expires_in,
		};
		await saveConfig();
		return true;
	}
	return false;
}

function wait(timeout) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, timeout);
	});
}

export async function refreshTokenWithRetry() {
	let ret = await refreshToken();
	let delay = 500;
	while (!ret) {
		await wait(delay);
		ret = await refreshToken();
		delay *= 2;
	}
}

export async function keepRefreshingToken() {
	while (true) {
		if (config.wechat.accessToken && config.wechat.accessToken.expiration) {
			await wait((config.wechat.accessToken.expiration - 600) * 1000 - Date.now());
		}
		await refreshTokenWithRetry();
	}
}
