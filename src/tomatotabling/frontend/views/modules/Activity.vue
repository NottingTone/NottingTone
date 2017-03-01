<template>
<group title="CLASSES">
	<cell v-for="(class_,idx) in classes" :title="class_.date">
		<div slot="icon" class="check">
			<tt-checkbox v-model="class_.selected" @input="onSelect(idx)"></tt-checkbox>
		</div>
	</cell>
</group>
</template>

<script>
import moment from 'moment';
import { Group, Cell } from 'vux';
import TtCheckbox from '../../components/Checkbox';

export default {
	components: {
		Group,
		Cell,
		TtCheckbox,
	},
	data() {
		return {
			classes: [],
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	methods: {
		reload() {
			this.$timetable.get()
			.then((data) => {
				const activityId = parseInt(this.$route.params.activity)
				const activity = data.activities.get(activityId);
				const firstWeek = moment(data.week0[data.settings.campus]);
				let activitySet = data.select._getActivity(activityId);
				const classes = [];
				for (const week of activity.weeks) {
					const set = data.select.getClass(activityId, week);
					classes.push({
						week,
						date: moment(firstWeek)
							.add(week, 'week')
							.day(activity.day)
							.format('MMM D YYYY (ddd)'),
						selected: set === null ? activitySet : set,
					});
				}
				this.classes = classes;
			});
		},
		onSelect(idx) {
			this.$timetable.select.setClass(
				this.classes[idx].selected,
				this.$route.params.activity,
				this.classes[idx].week
			);
			this.$timetable.select.deferCommit();
		},
	},
};
</script>

<style scoped>
.check {
	margin-right: 15px;
}
</style>
