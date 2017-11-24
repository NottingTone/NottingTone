<template>
<div>

	<div v-show="!search.active">
		<group title="FILTER">
			<tt-selector title="Type" :options="types" v-model="filter.type" @input="onSelectType"></tt-selector>
			<cell is-link title="Select" v-show="!filter.valid && filter.type" @click.native="onSearch"></cell>
			<template v-if="filter.valid">
				<tt-filter :filter="filter" @click.native="onSearch" is-link></tt-filter>
				<tt-button title="Delete Filter" @click.native="onDelete"></tt-button>
			</template>

		</group>
		<group title="MODULES">
			<tt-module v-for="module in modules" :module="module" :key="module.id"></tt-module>
			<cell title="No Modules" style="text-align: center" v-if="!modules.length"></cell>
		</group>
	</div>

	<search
		ref="search"
		:placeholder="search.placeholder"
		cancelText="Cancel"
		@result-click="onSearchSelect"
		@on-change="onSearchInput"
		@on-cancel="onSearchCancel"
		:results="search.results"
		v-model="search.input"
		v-show="search.active"
	></search>

</div>
</template>

<script>
import { Group, Cell, Search } from 'vux';
import TtButton from '../../components/Button';
import TtSelector from '../../components/Selector';
import TtFilter from '../../components/Filter';
import TtModule from '../../components/Module';

const PLACEHOLDERS = {
	'student': 'Student ID',
	'module': 'Code / Name',
	'y1group': 'Group',
	'staff': 'Name',
	'program': 'Code / Name',
	'room': 'Room',
	'exam': 'Student ID',
};

const MIN_SEARCH_LENGTH = {
	'module': 3,
	'y1group': 1,
	'staff': 3,
	'program': 1,
	'room': 2,
};

export default {
	components: {
		Group,
		Cell,
		Search,
		TtSelector,
		TtButton,
		TtFilter,
		TtModule,
	},
	data() {
		return {
			types: {
				'student': 'Student',
				'module': 'Module',
				'y1group': 'Year 1 Group',
				'staff': 'Staff',
				'program': 'Program',
				'room': 'Room',
				'exam': 'Exam',
			},
			filter: {},
			search: {
				placeholder: '',
				input: '',
				results: [],
				active: false,
				timer: null,
			},
			modules: [],
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload(to.params.filter));
	},
	beforeRouteUpdate(to, from, next) {
		// next callback will not be called
		next();
		this.reload(to.params.filter);
	},
	mounted() {
		this.$refs.search.$refs.input.setAttribute('maxlength', 100);
	},
	methods: {
		reload(idx) {
			this.$timetable.get()
			.then((data) => {
				if (idx === '-1') {
					this.filter = {
						// need a default type, or the first selection will be miss
						type: 'student',
						valid: false,
					};
				} else {
					const filter = Object.assign({}, data.filters[idx]);
					delete filter.activities;
					this.filter = {
						valid: true,
						...filter,
					};
				}
				this.$refs.search.cancel();
				this.reloadModules();
			});
		},
		reloadModules() {
			if (this.$route.params.filter === '-1') {
				this.modules = [];
			} else {
				const moduleIds = this.$timetable.getModuleIdsByFilterIdx(this.$route.params.filter);
				this.modules = moduleIds
					.map(x => this.$timetable.modules.get(x))
					.map(x => ({
						id: x.id,
						code: x.code,
						name: x.name,
						types: Object.keys(x.types),
					}));
			}
		},
		onSelectType() {
			this.filter.valid = false;
			this.modules = [];
		},
		onDelete() {
			this.$timetable.select.unsetFilter(parseInt(this.$route.params.filter));
			clearTimeout(this.$timetable.select.timer);
			this.$http.post(`filters/${this.$route.params.filter}/delete`, {
				select: this.$timetable.select.journal
			})
			.then((resp) => {
				this.$timetable.filters.splice(this.$route.params.filter, 1);
				this.$router.back();
			});
			this.$timetable.select.journal = {};
		},
		onSearch() {
			this.$refs.search.clear();
			this.search.results = [];
			this.search.placeholder = PLACEHOLDERS[this.filter.type];
			this.search.active = true;
		},
		onSearchInput(input) {
			if (['student', 'exam'].includes(this.filter.type)) {
				if (/^(\d{7}|(165|200)\d{5})$/.test(input)) {
					this.search.results = [{
						id: input,
						title: input,
					}];
				} else {
					this.search.results = [];
				}
			} else {
				if (this.search.timer) {
					clearTimeout(this.search.timer);
				}
				if (input.length >= MIN_SEARCH_LENGTH[this.filter.type]) {
					this.search.timer = setTimeout(() => {
						this.performSearch();
					}, 1000);
				}
			}
		},
		onSearchSelect(result) {
			const idx = parseInt(this.$route.params.filter);
			this.search.active = false;
			const filter = {
				type: this.filter.type,
				id: result.id,
			};
			const existentIdx = this.$timetable.findFilter(filter);
			if (existentIdx !== -1 && existentIdx !== idx) {
				this.$vux.alert.show({
					title: 'Error',
					content: 'Same filter already exists',
				});
			} else {
				this.$http.put(`filters/${idx}`, filter)
				.then((resp) => {
					const newIdx = idx === -1 ? this.$timetable.filters.length : idx;
					this.$timetable.update({
						filters: {
							[newIdx]: resp.data.filters[0],
						},
						modules: resp.data.modules,
						activities: resp.data.activities,
					});
					if (idx === -1) {
						this.$router.replace({ name: 'filter', params: { filter: newIdx.toString() } })
					} else {
						this.filter = {
							...filter,
							...result,
							valid: true,
						};
						this.reloadModules();
					}
				}).catch((resp) => {
					this.$vux.alert.show({
						title: 'Error',
						content: 'Incorrect filter',
					});
				});
			}
		},
		onSearchCancel() {
			this.search.active = false;
		},
		performSearch() {
			this.$http.post('search', {
				type: this.filter.type,
				key: this.search.input,
			}).then((resp) => {
				this.search.results = resp.data.map(this.renderSearchResults, this);
			});
		},
		renderSearchResults(result) {
			switch (this.filter.type) {
			case 'module':
			case 'program':
				return { title: `${result.code} ${result.name}`, ...result };
			case 'y1group':
			case 'staff':
				return { title: result.name, ...result };
			case 'room':
				if (this.$timetable.settings.campus === 'unnc') {
					if (this.$timetable.settings.building === 'legacy') {
						return { title: `${result.alias} (${result.name})`, ...result };
					}
					return { title: `${result.name} (${result.alias})`, ...result };
				} else {
					return { title: result.name, ...result };
				}
			}
		}
	},
};
</script>
