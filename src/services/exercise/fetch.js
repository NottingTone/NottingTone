import { Iconv } from 'iconv';
import request from 'request-promise-native';
import moment from 'moment';

const gbk2utf8 = new Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');

const TYPEID = {
	morning: '0304',
	exercise: '0302',
	run: '0303'
};

const URLS = {
	lastTerm: 'https://sports.nottingham.edu.cn/Student/kaoqingchaxun/pe/index1.asp',
	thisTerm: 'https://sports.nottingham.edu.cn/Student/kaoqingchaxun/pe/index.asp'
};

async function fetchRecords(stuId, term, type) {
	const url = `${URLS[term]}?types=${TYPEID[type]}`;
	const body = await request(url, {
		encoding: null,
		headers: {
			Cookie: `C%5FStudent%5FNo=${stuId}`,
		},
	});
	const html = gbk2utf8.convert(body).toString();
	const pattern = /<tr align=middle bgcolor=#efefef>([\s\S]*?)<\/tr>/g;
	let match = pattern.exec(html); // skip first match (table header)
	const times = [];
	while ((match = pattern.exec(html))) {
		const tds = match[1].split(/\s*<.*?>\s*(?:<.*?>)?/).slice(1, -1).map(x => x.replace(/&nbsp;/g, ''));
		if (tds.length === 6) {
			const number = parseInt(tds[3], 10);
			const time = moment(tds[5], 'M/D/YYYY H:m:s A').unix();
			times.push({
				number,
				time,
			}); 
		}
	}
	return times;
}

export async function fetchOverview(stuId) {
	const overview = {};
	for (const term of ['lastTerm', 'thisTerm']) {
		const records = await fetchRecords(stuId, term, 'run');
		overview[term] = {
			number: records.reduce((a, b) => a + b.number, 0),
			last: records.length ? records.slice(-1)[0].time : -1,
		};
	}
	return overview;
}

export async function fetchAllRecords(stuId) {
	return {
		lastTerm: await fetchRecords(stuId, 'lastTerm', 'run'),
		thisTerm: await fetchRecords(stuId, 'thisTerm', 'run'),
	};
}
