<template>
<div>
	<group title="SETTINGS">
		<tt-selector title="Campus" :options="options.campus" v-model="settings.campus" @input="saveCampus"></tt-selector>
		<tt-selector title="Building Display" :options="options.building" v-model="settings.building" v-show="settings.campus === 'unnc'" @input="saveSettings"></tt-selector>
		<tt-selector title="Module Display" :options="options.module" v-model="settings.module" @input="saveSettings"></tt-selector>
	</group>

	<group title="EXPORT AS ICAL">
		<tt-selector title="Alarm" :options="options.alarm" v-model="settings.alarm" @input="saveSettings"></tt-selector>
		<tt-button title="Export" @click.native="onExport('ics')"></tt-button>
	</group>

	<group title="EXPORT AS PDF">
		<tt-button title="Export" @click.native="onExport('pdf')"></tt-button>
	</group>
</div>
</template>

<script>
import Vue from 'vue';
import { Group, Cell } from 'vux';
import TtSelector from '../components/Selector';
import TtButton from '../components/Button';

export default {
	components: {
		Group,
		Cell,
		TtSelector,
		TtButton,
	},
	data() {
		return {
			options: {
				campus: {
					'unnc': 'UNNC',
					'unuk': 'UNUK',
				},
				building: {
					'current': 'Current',
					'legacy': 'Legacy',
				},
				module: {
					'full': 'Full Name',
					'acronym': 'Acronym',
					'code': 'Module Code',
				},
				alarm: {
					'no': 'No Alarm',
					'-0': 'At time of activity',
					'-10': '10 Minutes Before',
					'-20': '20 Minutes Before',
					'-30': '30 Minutes Before',
					'-40': '40 Minutes Before',
					'-50': '50 Minutes Before',
					'-60': '1 Hour Before',
				},
			},
			settings: {
				campus: '',
				building: '',
				module: '',
				alarm: '',
			},
		};
	},
	beforeRouteEnter(to, from, next) {
		next(vm => vm.reload());
	},
	methods: {
		reload() {
			this.$timetable.get().then((data) => {
				Object.assign(this.settings, data.settings);
			});
		},
		saveSettings() {
			const settings = Object.assign({}, this.settings);
			if (settings.campus !== 'unnc') {
				settings.building = 'current';
			}
			this.$http.put('settings', settings)
			.then((resp) => {
				Object.assign(this.$timetable.settings, settings);
			});
		},
		saveCampus() {
			if (this.settings.campus !== this.$timetable.settings.campus) {
				this.$vux.confirm.show({
					title: 'Warning',
					content: 'Switching campus will cause all current activities lost',
					confirmText: 'Confirm',
					cancelText: 'Cancel',
					onCancel: () => {
						this.settings.campus = this.$timetable.settings.campus;
					},
					onConfirm: () => {
						this.$timetable.clear();
						this.saveSettings();
					},
				});
			}
		},
		onExport(type) {
			this.$router.replace({ query: { export: type, uid: this.$timetable.uid } });
		},
	},
};
</script>
