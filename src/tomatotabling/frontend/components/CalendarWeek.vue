<template>
<div @scroll="onScroll" ref="scroller" class="scroller">
	<div class="mask" :style="{ height: `${haxisHeight-6}px`, width: `${vaxisWidth}px` }"></div>
	<div class="vaxis" ref="vaxis" :style="{ transform: `translate3d(0, -${position.top}px, 0)`, top: `${haxisHeight}px` }">
		<div v-for="time in times" :style="{ height: `${time.height}px` }">
			<div class="time">{{time.time}}</div>
		</div>
	</div>
	<div class="haxis" ref="haxis" :style="{ transform: `translate3d(-${position.left}px, 0, 0)`, left: `${vaxisWidth}px` }">
		<div v-for="day in days" :style="{ width: `${day.width}px` }">
			<div class="text-day">{{day.day}}</div>
			<div class="text-date" v-if="week !== -1">{{day.date}}</div>
		</div>
	</div>

	<table :style="{ margin: `${haxisHeight}px 0 0 ${vaxisWidth}px` }">
		<thead>
			<tr style="height: 0">
				<th v-for="day in days" :colspan="day.cols" ref="tableCols"></th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="tr in trs" ref="tableRows">
				<td class="cell" v-for="td in tr" :rowspan="td.end - td.start" :class="{ inactive: showAll && td.active === false }">
					<template v-if="td.type !== 'empty' && (td.active || showAll)">
						<template v-if="showAll">
							<div class="weeks-placeholder">{{td.weeks}}</div>
							<div class="weeks">{{td.weeks}}</div>
						</template>
						<div v-for="module in td.modules" class="text-module">
							<template v-if="settings.module === 'code'">{{module.code}}</template>
							<template v-else-if="settings.module === 'acronym'">{{module.acronym}}</template>
							<template v-else>{{module.name}}</template>
						</div>
						<div class="type">
							<i class="tti" :class="td.type.icon" :style="{ color: td.type.color }"></i>
						</div>
						<div class="rooms-placeholder">
							<div v-for="room in td.rooms">
								<template v-if="settings.building === 'legacy'">{{room.alias}}</template>
								<template v-else>{{room.name}}</template>
							</div>
						</div>
						<div class="rooms">
							<div v-for="room in td.rooms">
								<template v-if="settings.building === 'legacy'">{{room.alias}}</template>
								<template v-else>{{room.name}}</template>
							</div>
						</div>
					</template>
				</td>
			</tr>
		</tbody>
	</table>
</div>
</template>

<script>
import Vue from 'vue';
import moment from 'moment';
import { getTypeStyle } from '../../common/activity-types';
import { getAcronym, getWeeksText } from '../../common/text';
import { GridDay } from '../../common/grid';

export default {
	props: {
		week: Number,
		settings: Object,
		showAll: Boolean,
	},
	data() {
		return {
			times: [],
			days: [],
			trs: [],
			position: {
				top: 0,
				left: 0,
			},
			haxisHeight: 0,
			vaxisWidth: 0,
		};
	},
	created() {
		this.prepareVaxis();
	},
	methods: {
		prepareVaxis() {
			const times = [];
			const time = moment('09:00', 'HH:mm');
			for (let i = 0; i < 19; ++i) {
				times.push({
					time: time.format('HH:mm'),
					height: 0,
				});
				time.add(30, 'minutes');
			}
			this.times = times;
		},
		prepareData() {
			const dayStart = moment('09:00', 'HH:mm');
			const data = this.$timetable;
			const activityGrid = [];
			for (let i = 0; i < 5; ++i) {
				activityGrid.push(new GridDay());
			}
			for (const activity of data.activities.values()) {
				const thisWeek = activity.weeks.includes(this.week);
				const activitySet = data.select._getActivity(activity.id);
				const classSet = data.select.getClass(activity.id, this.week);
				const active = thisWeek && (classSet === null && activitySet || classSet);
				if (activitySet || active) {
					const moduleIds = data.getModuleIdsByActivityIds([activity.id]);
					const day = moment(activity.day, 'dddd').day() - 1;
					activityGrid[day].addActivity({
						id: activity.id,
						modules: moduleIds
							.map(x => data.modules.get(x))
							.map(x => ({
								name: x.name,
								code: x.code,
								acronym: getAcronym(x.name),
							})),
						start: moment(activity.start, 'HH:mm').diff(dayStart, 'minutes') / 30,
						end: moment(activity.end, 'HH:mm').diff(dayStart, 'minutes') / 30,
						rooms: [...activity.rooms],
						type: getTypeStyle(activity.type),
						weeks: getWeeksText(activity.weeks),
						active,
					});
				}
			}
			const trs = [];
			for (const day of activityGrid) {
				for (const column of day.rows) {
					column.startRead();
				}
			}
			for (let i = 0; i < 18; ++i) {
				const tds = [];
				for (const day of activityGrid) {
					for (const column of day.rows) {
						const activity = column.read(i);
						if (activity) {
							tds.push(activity);
						}
					}
				}
				trs.push(tds);
			}
			this.trs = trs;

			const days = [];
			const monday = moment(data.week0[data.settings.campus])
				.add(this.week, 'week')
				.day('Mon');
			for (let i = 0; i < 5; ++i) {
				const date = moment(monday).add(i, 'day');
				days.push({
					day: date.format('ddd'),
					date: date.format('MMM DD'),
					isToday: date.isSame(moment(), 'day'),
					cols: activityGrid[i].rows.length,
				});
			}
			this.days = days;

			Vue.nextTick(() => {
				this.haxisHeight = this.$refs.haxis.offsetHeight;
				this.vaxisWidth = this.$refs.vaxis.offsetWidth;
			});
		},
		reload() {
			this.prepareData();
			this.resize();
		},
		resize() {
			Vue.nextTick(() => {
				for (const [idx, el] of this.$refs.tableRows.entries()) {
					this.times[idx].height = el.offsetHeight;
				}
				for (const [idx, el] of this.$refs.tableCols.entries()) {
					this.days[idx].width = el.offsetWidth;
				}
			});
		},
		onScroll(e) {
			this.position.left = this.$refs.scroller.scrollLeft;
			this.position.top = this.$refs.scroller.scrollTop;
			e.stopPropagation();
		},
	},
	watch: {
		week: {
			handler() {
				this.reload();
			},
			immediate: true,
		},
		showAll() {
			this.resize();
		},
	},
};
</script>

<style scoped>
.scroller {
	background: #fbf9fe;
	overflow: scroll;
	height: 100%;
	-webkit-overflow-scrolling: auto;
	line-height: 1.2;
}
table {
	border-collapse: collapse;
	width: 100%;
}
table tr {
	height: 50px;
}
table th {
	text-align: center;
}
table td {
	border: 1px solid #000;
	min-width: 50px;
}
.mask, .vaxis, .haxis {
	position: absolute;
	background: #fbf9fe;
}
.mask {
	left: 0;
	top: 0;
	z-index: 3;
}
.vaxis {
	left: 0;
	z-index: 2;
}
.haxis {
	top: 0;
	z-index: 1;
	text-align: center;
	white-space: nowrap;
}
.haxis>* {
	display: inline-block;
}
.text-day {
	font-weight: 500;
	font-size: 14px;
	color: #333;
}
.text-date {
	font-size: 12px;
	color: #555;
}
.time {
	transform: translate3d(0, -50%, 0);
	color: #aaa;
	font-size: 12px;
}
.code {
	font-family: monospace;
	font-size: 12px;
}
.text-module {
	font-weight: 500;
	font-size: 14px;
	text-align: center;
}
.type {
	margin: 6px 0;
	text-align: center;
}
.cell {
	position: relative;
	padding: 6px;
}
.rooms, .rooms-placeholder, .weeks, .weeks-placeholder {
	font-size: 12px;
}
.rooms-placeholder, .weeks-placeholder {
	visibility: hidden;
	white-space: nowrap;
}
.rooms, .weeks {
	position: absolute;
	width: 100%;
	left: 0;
	padding: 6px;
}
.rooms {
	bottom: 0;
}
.weeks {
	top: 0;
}
.inactive {
	background: #ddd;
	color: #777;
}
</style>
