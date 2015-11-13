#!/usr/bin/env python
#-*- coding: utf-8 -*-

URL_QUERY = 'http://60.190.19.138:7080/stu/sel_result.jsp'
REGEX_TR = r'<tr>[\s\S]*?<\/tr>'
REGEX_TH = r'<th[\s\S]*?>[\s\S]*?<\/th>'
REGEX_TD = r'<td[\s\S]*?>([\s\S]*?)<\/td>'
REGEX_NUM = r'[\d\.]+'
REGEX_TIME = r'The above information up to ([\s\S]*?)<\/'
REGEX_BACK = r'history\.back\(\);'

import codecs
import os
import re
import datetime, time
import urlparse
import urllib3
import sqlite3

def str2fen(s):
	return int(float(s)*100)


if __name__ == '__main__':

	uri_parsed = urlparse.urlparse(URL_QUERY)

	http_pool = urllib3.HTTPConnectionPool(uri_parsed.hostname, uri_parsed.port)

	conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), '../../db/coal.sqlite3'))
	cursor = conn.cursor()
	room_list = conn.cursor()

	cursor.execute('CREATE TABLE IF NOT EXISTS roomlist (id INTEGER PRIMARY KEY, build INTEGER, room INTEGER)')
	cursor.execute('CREATE TABLE IF NOT EXISTS data (rid, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money, time)')
	cursor.execute('CREATE TABLE IF NOT EXISTS usage (rid, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money, time)')

	count = 0
	room_list.execute('SELECT * FROM roomlist')

	room = room_list.fetchone()

	while room:

		rid = room['id']
		build = room['build']
		room = room['room']

		data = "build={0}&room={1}&xw=%D0%A3%CD%E2%B2%E9%D1%AF".format(build, room)
		req = http_pool.urlopen('POST', uri_parsed.path, headers={'Content-Type': 'application/x-www-form-urlencoded'}, body=data)
		html = req.data.decode('gbk')

		if re.search(REGEX_BACK, html):
			print 'BUILD {0} ROOM {1} DOES NOT EXIST'.format(build, room)
		else:
			time_str = re.search(REGEX_TIME, html).group(1)
			time_datetime = datetime.datetime.strptime(time_str, '%Y-%m-%d %H:%M %p')
			timestamp = int(time.mktime(time_datetime.timetuple()))

			tr_tags = re.findall(REGEX_TR, html)

			ret = {}

			for tr_tag in tr_tags:
				if re.search(REGEX_TH, tr_tag):
					continue
				td_tags = re.findall(REGEX_TD, tr_tag)

				value_match = re.search(REGEX_NUM, td_tags[1])
				if value_match:
					value = str2fen(value_match.group(0))
				else:
					value = -1

				money_match = re.search(REGEX_NUM, td_tags[2])
				if money_match:
					money = str2fen(money_match.group(0))
				else:
					money = -1

				item = {
					'value': value,
					'money': money
				}

				if td_tags[0].find(u'冷水表') != -1:
					ret['water'] = item
				if td_tags[0].find(u'热水表') != -1:
					ret['hotwater'] = item
				if td_tags[0].find(u'电表') != -1:
					ret['electricity'] = item

			cursor.execute('SELECT * FROM data WHERE rid=? AND time=? LIMIT 1', (rid, timestamp))
			time_str = datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
			if cursor.fetchone():
				print 'ENTRY BUILD {0} ROOM {1} TIME {2} ALREADY EXISTS.'.format(build, room, time_str)
			else:
				cursor.execute('SELECT * FROM data WHERE rid=? AND time>=?-86400 AND time<? LIMIT 1', (timestamp,))
				yesterday = cursor.fetchone()
				if yesterday:
					cursor.execute('INSERT INTO usage (rid, time, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money) VALUES (?,?,?,?,?,?,?,?)',
						(rid, timestamp,
							ret['water']['value'] - yesterday['water_value'],
							ret['water']['money'] - yesterday['water_money'],
							ret['hotwater']['value'] - yesterday['hotwater_money'],
							ret['hotwater']['money'] - yesterday['hotwater_money'],
							ret['electricity']['value'] - yesterday['electricity_value'],
							ret['electricity']['money'] - yesterday['electricity_money']
						)
					)
				
				cursor.execute('INSERT INTO data (rid, time, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money) VALUES (?,?,?,?,?,?,?,?)',
					(rid, timestamp, 
						ret['water']['value'], 
						ret['water']['money'], 
						ret['hotwater']['value'], 
						ret['hotwater']['money'], 
						ret['electricity']['value'], 
						ret['electricity']['money']
					)
				)
				count += 1
				print 'BUILD {0} ROOM {1} TIME {2} DONE.'.format(build, room, time_str)

			if count % 100 == 0:
				conn.commit()

		room = room_list.fetchone()

	conn.commit()
	conn.close()

	print 'ALL DONE. AFFECTED ROOMS: %d' % count
