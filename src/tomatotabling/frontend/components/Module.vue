<template>

<card class="module">
	<div slot="content" class="text" @click="onClickModule">
		<template v-if="textStyle === 'full'">
			<div class="code secondary">{{module.code}}</div>
			<div class="name primary">{{module.name}}</div>
		</template>
		<template v-else-if="textStyle === 'acronym'">
			<div class="acronym primary">{{acronym}}</div>
			<div class="code secondary">{{module.code}}</div>
			<div class="name secondary">{{module.name}}</div>
		</template>
		<template v-else-if="textStyle === 'code'">
			<div class="code primary">{{module.code}}</div>
			<div class="name secondary">{{module.name}}</div>
		</template>

	</div>
	<div slot="footer" class="types">
		<div v-for="(type,idx) in module.types" @click="onClickType(idx)" class="vux-1px-r vux-tap-active" :class="{ 'vux-1px-l': idx === 0 }">
			<span :style="{ color: type.style.color }">
				<i class="tti" :class="type.style.icon"></i>
				<span class="type-text">{{type.style.text}}</span>
			</span>
		</div>
	</div>
</card>

</template>

<script>
import { Card } from 'vux';
import { getTypeStyle, typeComparer } from '../../common/activity-types';
import { getAcronym } from '../../common/text';

export default {
	props: {
		module: Object,
	},
	components: {
		Card,
	},
	data() {
		return {
			textStyle: '',
		};
	},
	watch: {
		module: {
			handler: function () {
				this.module.types = this.module.types
					.sort(typeComparer)
					.map(x => ({
						name: x,
						style: getTypeStyle(x),
					}));
				this.textStyle = this.$timetable.settings.module;
			},
			immediate: true,
		},
	},
	computed: {
		acronym() {
			return getAcronym(this.module.name);
		},
	},
	methods: {
		onClickModule(idx) {
			this.$router.push({
				name: 'module',
				params: {
					module: this.module.id,
				},
			});
		},
		onClickType(idx) {
			this.$router.push({
				name: 'type',
				params: {
					module: this.module.id,
					type: this.module.types[idx].name,
				},
			});
		},
	},
};

</script>

<style scoped>
.module {
	margin: 0;
}
.module .text {
	padding: 15px 15px 10px;
}
.module .types::before {
	content: '';
	position: absolute;
	left: 15px;
	top: 0;
	width: 100%;
	height: 1px;
	border-top: 1px solid #e5e5e5;
	transform: scaleY(0.5);
}
.module .types {
	display: flex;
	position: relative;
}
.module .types>div {
	flex: 1;
	text-align: center;
	padding: 5px 0;
}
.module .type-text {
	margin-left: 5px;
	font-family: monospace;
}
.module .text>.primary {
	font-size: 17px;
}
.module .text>.secondary {
	font-size: 13px;
	color: #666;
}
.module .text>.code, .module .text>.module-acronym {
	font-family: monospace;
}
</style>
