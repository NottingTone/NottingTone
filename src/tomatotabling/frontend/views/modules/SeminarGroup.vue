<template>
<group title="ACTIVITIES">
	<card class="activity vux-tap-active" v-for="(activity,idx) in activities" @click.native="onClickActivity(activity.id)">
		<cell slot="header" :title="activity.code" class="code" is-link>
			<div slot="icon" class="check">
				<tt-checkbox v-model="activity.selected" @input="onSelect(idx)"></tt-checkbox>
			</div>
		</cell>
		<div slot="content" class="info">
			<div class="item"><i class="tti tti-room"></i>{{activity.rooms.join(', ')}}</div>
			<div class="item"><i class="tti tti-clock"></i>{{activity.day}} {{activity.start}} - {{activity.end}}</div>
			<div class="item"><i class="tti tti-staff"></i>{{activity.staffs.join(', ')}}</div>
			<div class="item"><i class="tti tti-timetable"></i>Week {{activity.weeks}}</div>
		</div>
	</card>
</group>
</template>

<script>
import { Group, Cell, Card } from 'vux';
import TtCheckbox from '../../components/Checkbox';
import { getWeeksText } from '../../../common/text';

export default {
	components: {
		Group,
		Cell,
		Card,
		TtCheckbox,
	},
	data() {
		return {
			activities: [],
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	methods: {
		reload() {
			this.$timetable.get()
			.then((data) => {
				this.activities = data.modules
					.get(this.$route.params.module)
					.types[this.$route.params.type][this.$route.params.group]
					.map(x => data.activities.get(x))
					.map(x => ({
						id: x.id,
						code: x.code,
						day: x.day.slice(0, 3),
						start: x.start,
						end: x.end,
						rooms: x.rooms.map(y => data.settings.building === 'legacy' ? y.alias : y.name),
						staffs: [...x.staffs],
						weeks: getWeeksText(x.weeks),
						selected: data.select.getActivity(x.id),
					}));
			});
		},
		onClickActivity(id) {
			this.$router.push({
				name: 'activity',
				params: {
					activity: id,
				},
			});
		},
		onSelect(idx) {
			this.$timetable.select.setActivity(this.activities[idx].selected, this.activities[idx].id);
			this.$timetable.select.deferCommit();
		},
	},
};
</script>

<style scoped>
.activity {
	margin-top: 0;
}
.activity .code::after {
	content: '';
	position: absolute;
	left: 15px;
	bottom: 0;
	width: 100%;
	height: 1px;
	border-top: 1px solid #e5e5e5;
	transform: scaleY(0.5);
}
.activity .code {
	font-family: monospace;
	font-size: 15px;
	position: relative;
}
.check {
	margin-right: 15px;
}
.activity .info {
	padding: 6px 0;
}
.activity .info>.item {
	padding: 2px 10px;
	font-size: 15px;
}
.activity .info>.item>.tti {
	margin-right: 10px;
}
</style>
