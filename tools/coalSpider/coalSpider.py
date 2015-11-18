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
import leveldb
import json


count = 0

def str2fen(s):
	return int(float(s)*100)

def loadConfig():
	global config
	with open(os.path.join(os.path.dirname(__file__), '../../config.json')) as f:
		config = json.load(f);

def initDatabase():
	global conn, cursor, saveCursor, roomCursor
	conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), '../..', config['db']['path'], config['db']['sqlite']['coal']))
	cursor = conn.cursor()
	saveCursor = conn.cursor()
	roomCursor = conn.cursor()
	cursor.execute('CREATE TABLE IF NOT EXISTS roomlist (id INTEGER PRIMARY KEY, build INTEGER, room INTEGER)')
	cursor.execute('CREATE TABLE IF NOT EXISTS data (rid, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money, time)')
	cursor.execute('CREATE TABLE IF NOT EXISTS usage (rid, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money, time)')

	global userbind
	userbind = leveldb.LevelDB(os.path.join(os.path.dirname(__file__), '../..', config['db']['path'], config['db']['level']['userbind']))

def rowInserted():
	global count
	count += 1
	if count % 100 == 0:
		conn.commit()

def updateRoomList():
	for key, value in userbind.RangeIter(include_value = True):
		data = json.loads(value)
		if data.has_key('build') and data.has_key('room'):
			if not checkRoomExist(data['build'], data['room']): # 假定列表里的房间已查询
				ret = performQuery(data['build'], data['room'])
				if ret:
					print '新加一条'
					roomCursor.execute('INSERT INTO roomlist (build, room) VALUES (?,?)', (data['build'], data['room']))
					conn.commit()
					rid = roomCursor.lastrowid
					print rid, '<--'
					saveResultByRid(rid, ret)

def loadHTTPPool():
	global uri_parsed, http_pool
	uri_parsed = urlparse.urlparse(URL_QUERY)
	http_pool = urllib3.HTTPConnectionPool(uri_parsed.hostname, uri_parsed.port)

def performQueryForRoomList():
	roomCursor.execute('SELECT id, build, room FROM roomlist')
	room = roomCursor.fetchone()
	while room:
		print room
		if not checkTodayExistByRid(room[0]):
			print '还没数据'
			ret = performQuery(room[1], room[2])
			saveResultByRid(room[0], ret)
		else:
			print '已经有了'
		room = roomCursor.fetchone()

def performQuery(build, room):
	print 'query', build, room
	data = "build={0}&room={1}&xw=%D0%A3%CD%E2%B2%E9%D1%AF".format(build, room)
	req = http_pool.urlopen('POST', uri_parsed.path, headers={'Content-Type': 'application/x-www-form-urlencoded'}, body=data)
	html = req.data.decode('gbk')

	if re.search(REGEX_BACK, html):
		return None
	else:

		ret = {}

		time_str = re.search(REGEX_TIME, html).group(1)
		time_datetime = datetime.datetime.strptime(time_str, '%Y-%m-%d %H:%M %p')
		ret['timestamp'] = int(time.mktime(time_datetime.timetuple()))

		tr_tags = re.findall(REGEX_TR, html)

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

		return ret


def checkRoomExist(build, room):
	cursor.execute('SELECT id FROM roomlist WHERE build=? AND room=? LIMIT 1', (build, room))
	room = cursor.fetchone()
	if room:
		return room[0]
	else:
		return False

def checkTodayExistByRid(rid):
	now = int(time.time())
	cursor.execute('SELECT * FROM data WHERE rid=? AND time>=?-86400 AND time<? LIMIT 1', (rid, now, now))
	if (cursor.fetchone()):
		return True
	else:
		return False

def checkExistByRoom(build, room):
	rid = checkRoomExist
	if rid:
		return checkTodayExistByRid(room['rid'])
	else:
		return False

def getYesterdayByRid(rid):
	now = int(time.time())
	cursor.execute('SELECT water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money FROM data WHERE rid=? AND time>=?-172800 AND time<?-86400 LIMIT 1', (rid, now, now))
	yesterday = cursor.fetchone()
	if yesterday:
		return yesterday
	else:
		return None

def getUsage(today, yesterday):
	if today == -1 or yesterday == -1:
		return -1
	else:
		return today - yesterday

def saveResultByRid(rid, data):
	saveCursor.execute('INSERT INTO data (rid, time, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money) VALUES (?,?,?,?,?,?,?,?)',
		(rid, data['timestamp'], 
			data['water']['value'], 
			data['water']['money'], 
			data['hotwater']['value'], 
			data['hotwater']['money'], 
			data['electricity']['value'], 
			data['electricity']['money']
		)
	)
	yesterday = getYesterdayByRid(rid)
	if yesterday:
		saveCursor.execute('INSERT INTO usage (rid, time, water_value, water_money, hotwater_value, hotwater_money, electricity_value, electricity_money) VALUES (?,?,?,?,?,?,?,?)',
			(rid, data['timestamp'],
				getUsage(data['water']['value'], yesterday[0]),
				getUsage(data['water']['money'], yesterday[1]),
				getUsage(data['hotwater']['value'], yesterday[2]),
				getUsage(data['hotwater']['money'], yesterday[3]),
				getUsage(data['electricity']['value'], yesterday[4]),
				getUsage(data['electricity']['money'], yesterday[5])
			)
		)
	rowInserted()

def closeDatabase():
	conn.commit()
	conn.close()


if __name__ == '__main__':

	count = 0

	loadConfig()
	initDatabase()
	loadHTTPPool()
	performQueryForRoomList()
	updateRoomList()
	closeDatabase()

	print 'ALL DONE. AFFECTED ROOMS: %d' % count
