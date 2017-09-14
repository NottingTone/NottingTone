<template>
<group title="GROUPS">
	<cell v-for="(group,idx) in groups" :title="group.name" :link="{ name: 'group', params: { group: group.name } }" :key="group.name">
		<div slot="icon" class="check">
			<tt-checkbox v-model="group.selected" @input="onSelect(idx)"></tt-checkbox>
		</div>
	</cell>
</group>
</template>

<script>
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
			groups: [],
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	methods: {
		reload() {
			const moduleId = this.$route.params.module;
			const type = this.$route.params.type;
			this.$timetable.get()
			.then((data) => {
				const groups = data.modules
					.get(moduleId)
					.types[type];
				this.groups = Object.keys(groups).sort().map(group => ({
					name: group,
					selected: data.select.getGroup(moduleId, type, group)
				}));
			});
		},
		onSelect(idx) {
			this.$timetable.select.setGroup(
				this.groups[idx].selected,
				this.$route.params.module,
				this.$route.params.type,
				this.groups[idx].name
			);
			this.$timetable.select.deferCommit();
		},
	},
};
</script>

<style lang="less">
@import '~vux/src/styles/weui/widget/weui_cell/weui_check';
</style>

<style scoped>
.check {
	margin-right: 15px;
}
</style>