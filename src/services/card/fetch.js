import path from 'path';
import crypto from 'mz/crypto';
import { assert } from 'chai';
import request from 'request-promise-native';
import level from 'level';

import config from '../../config';

const lsmartBindPath = path.join(__dirname, '../../..', config.db.lsmart_bind);
const lsmartBind = level(lsmartBindPath);

async function queryByOpenid(openid) {
	const resp = await request.get({
		url: `http://wxschool.lsmart.cn/card/queryAcc_queryAccount.shtml?wxArea=16301&openId=${openid}`,
		followRedirect: false,
		resolveWithFullResponse: true,
		simple: false,
	});
	if (resp.statusCode === 302) {
		if (resp.headers['location'].startsWith('http://wxschool.lsmart.cn/card/ykt_toBind.shtml')) {
			throw new Error('UNBIND');
		}
		throw new Error('ERROR_IN_QUERY');
	}
	const balance = resp.body.match(/<p class="w_p_c" id="w_p_c_p">校园卡余额<strong>(.*?)<\/strong>元<\/p>/)[1];
	const stuName = resp.body.match(/<li class="bob"><span class="w_sp_l">姓&ensp;&ensp;&ensp;&ensp;名<\/span><span class="w_sp_r">(.*?)<\/span><\/li>/)[1];
	const stuId = resp.body.match(/<li class="bob"><span class="w_sp_l" id="account_show">学&ensp;&ensp;&ensp;&ensp;号<\/span><span class="w_sp_r">(.*?)<\/span><\/li>/)[1];
	return {
		balance: parseFloat(balance),
		stuName,
		stuId,
	};
}

async function bindStudent(openid, stuName, stuId) {
	const body = await request.post({
		url: 'http://wxschool.lsmart.cn/card/ykt_doBind.shtml',
		form: {
			wxArea: '16301',
			openId: openid,
			userName: stuName,
			studentNo: stuId,
		},
	});
	return !!body.match(/^\d+$/);
}

async function randomOpenid() {
	const buf = await crypto.randomBytes(21);
	return buf.toString('base64').replace(/[+\/]/g, '_');
}

export async function fetchCardByStuId(stuId) {
	let bindInfo;
	try {
		bindInfo = JSON.parse(await lsmartBind.get(stuId));
	} catch(e) {
		assert(false, 'NO_BIND_INFO');
	}
	let result;
	try {
		const ret = await queryByOpenid(bindInfo.openid);
		assert(ret.stuId === stuId, 'STUID_MISMATCH');
		return ret.balance;
	} catch(e) {
		return await fetchCardByStuIdName(stuId, bindInfo.stuName);
	}
}

export async function fetchCardByStuIdName(stuId, stuName) {
	const openid = await randomOpenid();
	assert(await bindStudent(openid, stuName, stuId), 'ERROR_IN_BINDING');
	await lsmartBind.put(stuId, JSON.stringify({
		openid,
		stuName,
	}));
	const ret = await queryByOpenid(openid);
	assert(ret.stuId === stuId, 'STUID_MISMATCH');
	return ret.balance;
}
