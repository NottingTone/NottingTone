<template>
<div>
	<group title="FILTERS">
		<tt-filter v-for="(filter,idx) in filters" :filter="filter" :link="{ name: 'filter', params: { filter: idx.toString() } }" :key="filter.type + filter.id"></tt-filter>
		<tt-button :link="{ name: 'filter', params: { filter: '-1' } }" title="New Filter"></tt-button>
	</group>

	<group title="MODULES">
		<tt-module v-for="module in modules" :module="module" :key="module.id"></tt-module>
		<cell title="No Modules" style="text-align: center" v-if="!modules.length"></cell>
	</group>

</div>
</template>

<script>
import { Cell, Group } from 'vux';
import TtButton from '../../components/Button';
import TtFilter from '../../components/Filter';
import TtModule from '../../components/Module';

export default {
	components: {
		Cell,
		Group,
		TtButton,
		TtFilter,
		TtModule,
	},
	data() {
		return {
			filters: [],
			modules: [],
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	methods: {
		reload() {
			this.$timetable.get()
			.then((data) => {
				this.filters = data.filters.map(x => ({...x}));
				this.modules = [...data.modules.values()]
					.filter(x => data.select.getModule(x.id))
					.map(x => ({
						id: x.id,
						code: x.code,
						name: x.name,
						types: Object.keys(x.types),
					}));
			});
		},
	},
};

</script>
