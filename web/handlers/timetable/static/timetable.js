"use strict";

var container = document.getElementById('scroller');

var minWeek, maxWeek, currentWeek, showAll;

var thisWeek = moment().diff(firstWeek, 'week') + 1;

for (var i in data) {
	for (var j in data[i].weeks) {
		minWeek = data[i].weeks[j] > minWeek ? minWeek : data[i].weeks[j]; // this can handle undefined min/max
		maxWeek = data[i].weeks[j] < maxWeek ? maxWeek : data[i].weeks[j];
	}
}

function parseTime (time) {
	return moment('2000-01-01 ' + time);
}

function showTimetableByWeek (week, showAll) {

	var activityList = [[[]],[[]],[[]],[[]],[[]]];

	var timePoint = [];

	for (var i = 9; i < 18; ++i) {
		timePoint.push(i + ':00');
		timePoint.push(i + ':30');
	}
	timePoint.push('18:00');

	for (var i in data) {
		for (var j in data[i].weeks) {
			if (data[i].weeks[j] === week || showAll) {
				activityList[moment().day(data[i].day).day()-1][0].push(data[i]);
				if (timePoint.indexOf(data[i].start) === -1) {
					timePoint.push(data[i].start);
				}
				if (timePoint.indexOf(data[i].end) === -1) {
					timePoint.push(data[i].end);
				}
				break;
			}
		}
	}

	for (var day in activityList) {
		activityList[day][0].sort(function (a, b) {
			return parseTime(a.start) - parseTime(b.start);
		});
		var column = 0;
		do {
			var conflict = false;
			for (var i = 0; i < activityList[day][column].length - 1; ++i) {
				if (parseTime(activityList[day][column][i].end) > parseTime(activityList[day][column][i+1].start)) {
					++i;
					if (!conflict) {
						activityList[day].push([]);
						conflict = true;
					}
					activityList[day][column+1].push(activityList[day][column][i]);
					activityList[day][column][i] = null;
				}
			}
			if (conflict) {
				++column;
			}
		} while (conflict);
	}

	var idx;
	for (var day in activityList) {
		for (var column in activityList[day]) {
			while ((idx = activityList[day][column].indexOf(null)) !== -1) {
				activityList[day][column].splice(idx, 1);
			}
		}
	}

	var $ = document.createElement.bind(document);
	var timetable = $('table');
	timetable.classList.add('timetable');
	var thead = $('thead');
	var trHead = $('tr');
	var day = moment(firstWeek).add(week - 1, 'week').day('Sun');
	var th = $('th');
	th.classList.add('show-all')
	var check = $('input');
	check.id = 'show-all';
	check.type = 'checkbox';
	check.checked = showAll;
	check.addEventListener('change', showAllOnChange);
	th.appendChild(check);
	th.appendChild(document.createTextNode('all'));
	trHead.appendChild(th);
	for (var i = 0; i < 5; ++i) {
		day.add(1, 'day');
		var th = $('th');
		th.colSpan = activityList[i].length;
		var spanDay = $('span');
		spanDay.classList.add('day');
		spanDay.textContent = day.format('ddd');
		var spanDate = $('span');
		spanDate.classList.add('date');
		spanDate.textContent = day.format('DD MMM');
		th.appendChild(spanDay);
		th.appendChild(spanDate);
		trHead.appendChild(th);
	}
	thead.appendChild(trHead);

	var tbody = $('tbody');

	var cursor = {};

	for (var day in activityList) {
		cursor[day] = [];
		for (var column in activityList[day]) {
			cursor[day].push(0);
		}
	}

	for (var i = 0; i < timePoint.length; ++i) {
		var tr = $('tr');
		var th = $('th');
		th.classList.add('time');
		var spanTime = $('span');
		spanTime.classList.add('time-marking');
		spanTime.textContent = timePoint[i];
		th.appendChild(spanTime);
		tr.appendChild(th);
		for (var day in activityList) {
			for (var column in activityList[day]) {
				if (activityList[day][column].length === 0 && i === 0) {
					var td = $('td');
					td.rowSpan = timePoint.length - 1;
					tr.appendChild(td);
				} else if (cursor[day][column] < activityList[day][column].length) {
					var activity = activityList[day][column][cursor[day][column]];
					if (activity.end === timePoint[i]) {
						var rowSpan;
						++cursor[day][column];
						if (cursor[day][column] < activityList[day][column].length) {
							activity = activityList[day][column][cursor[day][column]];
							rowSpan = timePoint.indexOf(activity.start) - i;
						} else {
							rowSpan = timePoint.length - timePoint.indexOf(activity.end) - 1;
						}
						if (rowSpan) {
							var td = $('td');
							td.rowSpan = rowSpan;
							tr.appendChild(td);
						}
					}
					if (activity.start === timePoint[i]) {
						var td = $('td');
						td.innerHTML = activity.module;
						td.rowSpan = timePoint.indexOf(activity.end) - i;
						tr.appendChild(td);
					} else if (cursor[day][column] === 0 && i === 0) {
						var td = $('td');
						td.rowSpan = timePoint.indexOf(activity.start);
						tr.appendChild(td);
					}
				}
			}
		}
		tbody.appendChild(tr);
	}

	timetable.appendChild(thead);
	timetable.appendChild(tbody);
	
	container.innerHTML = '';
	container.appendChild(timetable);

	document.title = 'Week ' + week;
	var iframe = $('iframe');
	iframe.style.display = 'none';
	iframe.src="http://baidu.com";
	iframe.onload = function () {
		setTimeout(function() {
			iframe.parentElement.removeChild(iframe);
		}, 0);
	}
	document.body.appendChild(iframe);
}

currentWeek = thisWeek;
showTimetableByWeek(currentWeek);

var weekControls = {
	prevWeek: document.getElementById('prevWeek'),
	thisWeek: document.getElementById('thisWeek'),
	nextWeek: document.getElementById('nextWeek'),
	setDisable: function () {
		weekControls.prevWeek.disabled = currentWeek === minWeek;
		weekControls.thisWeek.disabled = currentWeek === thisWeek;
		weekControls.nextWeek.disabled = currentWeek === maxWeek;
	}
}

weekControls.prevWeek.addEventListener('click', function () {
	--currentWeek;
	weekControls.setDisable();
	showTimetableByWeek(currentWeek, showAll);
});

weekControls.thisWeek.addEventListener('click', function () {
	currentWeek = thisWeek;
	weekControls.setDisable();
	showTimetableByWeek(currentWeek, showAll);
});

weekControls.nextWeek.addEventListener('click', function () {
	++currentWeek;
	weekControls.setDisable();
	showTimetableByWeek(currentWeek, showAll);
});

function showAllOnChange() {
	showAll = this.checked;
	console.log(showAll);
	showTimetableByWeek(currentWeek, showAll);
}
