<template>

<cell is-link :title="title">
	<div slot="default">{{options[selectVal]}}</div>
	<select slot="child" class="tt-selector" v-model="selectVal" @change="onChange">
		<option v-for="show, val in options" :value="val">{{show}}</option>
	</select>
</cell>

</template>

<script>
import { Cell } from 'vux';

export default {
	props: {
		title: String,
		options: Object,
		value: String,
	},
	components: {
		Cell,
	},
	data() {
		return {
			selectVal: '',
		};
	},
	methods: {
		onChange() {
			this.$emit('input', this.selectVal);
		},
	},
	watch: {
		value: {
			handler(val) {
				this.selectVal = val;
			},
			immediate: true,
		},
	},
};
</script>

<style>
.tt-selector {
	position: absolute;
	top: 0; left: 0px; height: 100%; width: 100%;
	font-size: inherit;
	color: inherit;
	border: none;
	opacity: 0;
}
</style>
