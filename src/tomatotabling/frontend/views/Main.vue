<template>
<div style="height: 100%">
	<loading v-model="isLoadingFake" v-show="loading > 0" text="Loading"></loading>
	<view-box :class="{ nopadding: !shownTabbar }">
		<keep-alive>
			<router-view @show-bars="showBars"></router-view>
		</keep-alive>
		<tabbar v-show="isMain && shownTabbar" slot="bottom">
			<tabbar-item link="/timetable" :selected="!!$route.path.match(/^\/timetable(\/|$)/)">
				<div slot="icon" class="tti tabbar-icon tti-timetable"></div>
				<span slot="label">Timetable</span>
			</tabbar-item>
			<tabbar-item link="/modules" :selected="!!$route.path.match(/^\/modules(\/|$)/)">
				<div slot="icon" class="tti tabbar-icon tti-module"></div>
				<span slot="label">Modules</span>
			</tabbar-item>
			<tabbar-item link="/more" :selected="!!$route.path.match(/^\/more(\/|$)/)">
				<div slot="icon" class="tti tabbar-icon tti-more"></div>
				<span slot="label">More</span>
			</tabbar-item>
		</tabbar>
	</view-box>
	<div class="export" v-show="$route.query.export && loading === 0" @click="$router.replace({})">
		<div class="text">Click the menu and open in browser</div>
	</div>
</div>
</template>

<script>
import Vue from 'vue';
import { Tabbar, TabbarItem, ViewBox, Loading, AlertPlugin, ConfirmPlugin } from 'vux';

Vue.use(AlertPlugin);
Vue.use(ConfirmPlugin);

export default {
	components: {
		Tabbar,
		TabbarItem,
		ViewBox,
		Loading,
	},
	computed: {
		isMain() {
			return /^\/(modules$|more$|timetable)/.test(this.$route.path);
		},
	},
	data() {
		return {
			isLoadingFake: true,
			loading: 0,
			shownTabbar: true,
		};
	},
	created() {
		Vue.http.interceptors.push((req, next) => {
			// defer loading, preventing flashing loading
			setTimeout(() => ++this.loading, 100);
			next(() => {
				--this.loading;
			});
		});
	},
	methods: {
		showBars(shown) {
			this.shownTabbar = shown;
		},
	},
};
</script>

<style lang="less">
@import '~vux/src/styles/reset.less';
@import '~vux/src/styles/1px.less';
</style>

<style>
body {
	background: #fbf9fe;
	user-select: none;
}
.weui_tabbar_item>.weui_tabbar_icon {
	font-size: 24px;
	color: #888;
}
.weui_tabbar_item.weui_bar_item_on>.weui_tabbar_icon {
	color: #09BB07;
}
html, body {
	height: 100%;
	width: 100%;
	overflow-x: hidden;
}
input, textarea {
	user-select: text;
}
i.tti {
	display: inline-block;
	vertical-align: middle;
}
.nopadding>#vux_view_box_body {
	padding: 0;
}
</style>

<style scoped>
.export {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: url(../imgs/wx.png) top 20px right 20px no-repeat rgba(0,0,0,.6);
	color: #fff;
	z-index: 501; /* tabbar = 500 */
}
.export > .text {
	position: absolute;
	top: 50px;
	right: 80px;
}
.tabbar-icon {
	font-size: 22px;
	position: relative;
	top: 4px;
}
</style>
