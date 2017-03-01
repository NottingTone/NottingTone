<template>
	<cell :is-link="isLink" :link="link" :title="title" :inline-desc="inlineDesc">
		<div slot="icon" class="filter-icon tti" :class="icon"></div>
	</cell>
</template>

<script>
import { Cell } from 'vux';

export default {
	props: {
		filter: Object,
		isLink: Boolean,
		link: [String, Object],
	},
	components: {
		Cell,
	},
	computed: {
		title() {
			switch (this.filter.type) {
			case 'program':
				return `Level ${this.filter.level}`;
			case 'student':
			case 'exam':
				return this.filter.id;
			case 'staff':
			case 'y1group':
				return this.filter.name;
			case 'module':
				return this.filter.code;
			case 'room':
				if (this.$timetable.settings.building === 'legacy') {
					return this.filter.alias;
				}
				return this.filter.name;
			}
		},
		inlineDesc() {
			if (this.filter.type === 'program') {
				return this.filter.name;
			} else {
				return '';
			}
		},
		icon() {
			return `tti-${this.filter.type}`;
		},
	},
};
</script>

<style scoped>
.filter-icon {
	font-size: 20px;
	margin-right: 15px;
}
</style>
