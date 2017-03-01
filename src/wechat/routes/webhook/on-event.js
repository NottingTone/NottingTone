import xml2js from 'xml2js-es6-promise';
import changeCase from 'change-case';

import config from '../../../config';
import getUnionid from '../../unionid';
import Session from '../../session';

async function parseEvent(xmlText) {
	const { xml: xmlObj } = await xml2js(xmlText);
	const event = {};
	for (const [key, [value]] of Object.entries(xmlObj)) {
		event[changeCase.camelCase(key)] = value;
	}
	return event;
}

export default async (ctx, next) => {
	const event = await parseEvent(ctx.request.body);
	const unionid = await getUnionid(event.fromUserName);
	const session = new Session(event, unionid, ctx.response, next);
	await session.process();
};
