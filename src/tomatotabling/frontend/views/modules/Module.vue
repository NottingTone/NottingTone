<template>
<group title="TYPES">
	<cell v-for="(type,idx) in types" :title="type.name" :link="{ name: 'type', params: { type: type.name } }">
		<div slot="icon">
			<tt-checkbox class="check" v-model="type.selected" @input="onSelect(idx)"></tt-checkbox>
			<i class="tti type-icon" :class="type.style.icon" :style="{ color: type.style.color }"></i>
		</div>
	</cell>
</group>
</template>

<script>
import { Group, Cell } from 'vux';
import TtCheckbox from '../../components/Checkbox';
import { getTypeStyle, typeComparer } from '../../../common/activity-types';

export default {
	components: {
		Group,
		Cell,
		TtCheckbox,
	},
	data() {
		return {
			types: [],
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	methods: {
		reload() {
			this.$timetable.get()
			.then((data) => {
				const types = data.modules
					.get(this.$route.params.module)
					.types;

				this.types = Object.keys(types).sort(typeComparer).map(type => ({
					name: type,
					selected: data.select.getType(this.$route.params.module, type),
					style: getTypeStyle(type),
				}));
			});
		},
		onSelect(idx) {
			this.$timetable.select.setType(
				this.types[idx].selected,
				this.$route.params.module,
				this.types[idx].name,
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
	margin-right: 5px;
}
.type-icon {
	margin-right: 5px;
}
</style>