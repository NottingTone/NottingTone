<template>

<cell :title="title" :link="link" class="tt-button" :class="{'vux-tap-active': true}"></cell>

</template>

<script>
import { Cell } from 'vux';

export default {
	props: {
		title: String,
		link: [String, Object],
	},
	components: {
		Cell,
	},
};
</script>

<style>
.tt-button {
	color: #fe0047 !important;
}
</style>
