<template>
<div class="week">
	<template v-for="day in days">
		<div class="hborder"></div>
		<div class="day">
			<div class="vborder"></div>
			<div class="date" :class="{ today: day.isToday, weekend: day.isWeekend }">
				<div class="text-day">{{day.day}}</div>
				<div class="text-date">{{day.date}}</div>
				<div class="text-month">{{day.month}}</div>
			</div>
			<div class="vborder"></div>
			<div class="classes">
				<div v-for="(class_,idx) in day.classes" class="class" :class="{ 'vux-1px-t': idx !== 0 }">
					<div class="code">
						<i class="tti" :class="class_.type.icon" :style="{ color: class_.type.color }"></i>
						<span class="monospace">{{class_.code}}</span>
					</div>
					<div class="modules">
						<div v-for="module in class_.modules" class="text-module">
							<template v-if="settings.module === 'code'">{{module.code}}</template>
							<template v-else-if="settings.module === 'acronym'">{{module.acronym}}</template>
							<template v-else>{{module.name}}</template>
						</div>
					</div>
					<div class="small">
						<div class="time">
							<i class="tti tti-clock"></i>
							{{class_.start}} - {{class_.end}}
						</div><!--
						--><div class="room">
							<i class="tti tti-room"></i>
							<span v-for="room in class_.rooms">
								<template v-if="settings.building === 'legacy'">{{room.alias}}</template>
								<template v-else>{{room.name}}</template>
							</span>
						</div>
					</div>
					<div class="small staff">
						<i class="tti tti-staff"></i>
						<div class="middle">{{class_.staffs}}</div>
					</div>
				</div>
			</div>
		</div>
	</template>
	<div class="hborder"></div>
</div>
</template>

<script>
import Vue from 'vue';
import moment from 'moment';

import { getTypeStyle } from '../../common/activity-types';
import { getAcronym } from '../../common/text';

export default {
	props: {
		week: Number,
		settings: Object,
	},
	data() {
		return {
			days: [],
		};
	},
	watch: {
		week: {
			handler() {
				this.reload();
			},
			immediate: true,
		},
	},
	methods: {
		reload() {
			const data = this.$timetable;
			const days = [];
			const sunday = moment(data.week0[data.settings.campus])
				.add(this.week, 'week')
				.day('Sun');
			for (let i = 0; i < 7; ++i) {
				const date = moment(sunday).add(i, 'day');
				days.push({
					day: date.format('ddd'),
					month: date.format('MMM'),
					date: date.format('DD'),
					isToday: date.isSame(moment(), 'day'),
					isWeekend: [0, 6].includes(date.day()),
					classes: [],
				});
			}
			for (const activity of data.activities.values()) {
				const thisWeek = activity.weeks.includes(this.week);
				const activitySet = data.select._getActivity(activity.id);
				const classSet = data.select.getClass(activity.id, this.week);
				if (thisWeek && (classSet === null && activitySet || classSet)) {
					const moduleIds = data.getModuleIdsByActivityIds([activity.id]);
					const day = moment(activity.day, 'dddd').day();
					days[day].classes.push({
						id: activity.id,
						code: activity.code,
						modules: moduleIds
							.map(x => data.modules.get(x))
							.map(x => ({
								name: x.name,
								code: x.code,
								acronym: getAcronym(x.name),
							})),
						start: activity.start,
						end: activity.end,
						staffs: activity.staffs.join(', '),
						rooms: [...activity.rooms],
						type: getTypeStyle(activity.type),
					});
				}
			}
			for (const day of days) {
				day.classes.sort((a, b) => moment(a.start, 'HH:mm') - moment(b.start, 'HH:mm'));
			}
			this.days = days;
		},
		resize() {},
	},
};
</script>

<style scoped>
.vborder {
	border-left: 1px solid #bbb;
	width: 1px;
}
.hborder {
	border-top: 1px solid #bbb;
	height: 1px;
}
.day {
	display: flex;
	background: #fff;
	line-height: 1;
	position: relative;
}
.date {
	flex: 0 0 40px;
	align-self: center;
	text-align: center;
	color: #444;
	margin: 10px 0;
}
.date.today {
	color: #2196f3;
}
.date.today::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	width: 5px;
	height: 100%;
	background: #2196f3;
}
.date.weekend {
	color: #d32f2f;
}
.text-month {
	font-size: 12px;
	color: #888;
}
.text-date {
	font-weight: bold;
	margin: 2px 0 5px;
}
.text-day {
	font-size: 12px;
	font-weight: 500;
}
.classes {
	flex: 1;
}
.class {
	padding: 6px;
}
.code {
	font-size: 12px;
	color: #666;
}
.modules {
	margin: 2px 0 6px;
}
.text-module {
	font-weight: 500;
	color: #222;
	font-size: 17px;
}
.time, .room {
	display: inline-block;
	box-sizing: border-box;
	width: 50%;
	vertical-align: top;
	color: #444;
}
.small {
	font-size: 14px;
}
.staff {
	margin: 3px 0 0;
}
.middle {
	display: inline-block;
	vertical-align: middle;
}
.monospace {
	font-family: monospace;
}
</style>