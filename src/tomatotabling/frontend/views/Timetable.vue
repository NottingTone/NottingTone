<template>
<div>

	<button-tab class="timetable-view" v-model="view" v-show="showBars">
		<button-tab-item>List</button-tab-item>
		<button-tab-item>Calendar</button-tab-item>
		<button-tab-item>All Weeks</button-tab-item>
	</button-tab>

	<div @click="toggleBars">
		<swiper v-if="view === 0" :show-dots="false" :show-desc-mask="false" v-model="currentIdx" :height="height" :threshold="150">
			<swiper-item v-for="(week,idx) in weeks" style="overflow-y: scroll">
				<list-week :week="week" :settings="settings" ref="weeks" v-if="Math.abs(idx-currentIdx) <= 1"></list-week>
			</swiper-item>
		</swiper>

		<swiper v-if="view === 1 || view === 2" :show-dots="false" :show-desc-mask="false" v-model="currentIdx" :height="height" :threshold="150">
			<swiper-item v-for="(week,idx) in weeks">
				<calendar-week :show-all="view === 2" :week="week" :settings="settings" ref="weeks" v-if="Math.abs(idx-currentIdx) <= 1"></calendar-week>
			</swiper-item>
		</swiper>
	</div>

</div>
</template>

<script>
import moment from 'moment';
import { ButtonTab, ButtonTabItem, Swiper, SwiperItem } from 'vux';
import ListWeek from '../components/ListWeek';
import CalendarWeek from '../components/CalendarWeek';

export default {
	components: {
		ButtonTab,
		ButtonTabItem,
		Swiper,
		SwiperItem,
		ListWeek,
		CalendarWeek,
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	data() {
		return {
			view: 0,
			weeks: [],
			currentIdx: 0,
			heights: [],
			settings: {},
			height: '500px',
			showBars: true,
		};
	},
	methods: {
		reload() {
			this.$timetable.get()
			.then((data) => {
				if (this.settings.campus !== data.settings.campus) {
					const sun0 = moment(data.week0[data.settings.campus]).day('Sun');
					const semester = data.semester[data.settings.campus];
					const currentWeek = moment().diff(sun0, 'week');
					this.currentIdx = Math.min(Math.max(semester[0], currentWeek), semester[1]) - semester[0];
					const weeks = [];
					for (let week = semester[0]; week <= semester[1]; ++week) {
						weeks.push(week);
					}
					this.weeks = weeks;
				}
				this.settings = { ...this.$timetable.settings };
				this.heights = [];
				if (this.$refs.weeks) {
					for (const week of this.$refs.weeks) {
						week.reload();
					}
				}
			});
		},
		onResize(idx, height) {
			if (this.showBars) {
				this.setHeight(window.innerHeight - 62 - 50);
			} else {
				this.setHeight(window.innerHeight);
			}
			if (this.$refs.weeks) {
				for (const week of this.$refs.weeks) {
					week.resize();
				}
			}
		},
		setHeight(height) {
			this.height = `${height}px`;
			if (this.$el) {
				const swiper = this.$el.querySelector('.vux-swiper');
				swiper && (swiper.style.height = this.height);
			}
		},
		toggleBars() {
			this.showBars = !this.showBars;
			this.onResize();
			this.$emit('show-bars', this.showBars);
		}
	},
	created() {
		window.onresize = () => {
			this.onResize();
		};
		this.onResize();
	},
};

</script>

<style scoped>
.timetable-view {
	margin: 15px;
}
</style>
