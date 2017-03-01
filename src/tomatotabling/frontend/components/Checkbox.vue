<template>

	<icon class="checkbox" :type="icon" @click.native.stop="onCheck" :class="{ intermediate: status === -1 }"></icon>

</template>

<script>
import { Icon } from 'vux';

const ICONS = {
	'0': 'circle',
	'-1': 'success',
	'1': 'success',
};

export default {
	props: {
		// 0: unselected, 1: selected, -1 partially selected
		value: Number,
	},
	components: {
		Icon,
	},
	data() {
		return {
			status: 0,
		};
	},
	methods: {
		onCheck() {
			if (this.status === -1) {
				this.status = 0;
			} else {
				// 0 <==> 1
				this.status = 1 - this.status;
			}
			this.$emit('input', this.status);
		},
	},
	watch: {
		value: {
			handler(val) {
				if (val > 0) {
					this.status = 1;
				} else if (val < 0) {
					this.status = -1;
				} else {
					this.status = 0;
				}
			},
			immediate: true,
		},
	},
	computed: {
		icon() {
			return ICONS[this.status];
		},
	},
};
</script>

<style scoped>
.checkbox.intermediate::before {
	color: #aaa;
}
</style>
