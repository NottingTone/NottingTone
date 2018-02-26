import 'babel-polyfill';

import Vue from 'vue';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';
import FastClick from 'fastclick';

import './icons.font.json';
import App from './views/Main';
import router from './router';
import data from './data';

Vue.use(VueRouter);
Vue.use(VueResource);
Vue.use(data);

Vue.http.options.root = '/tomatotabling';
Vue.http.interceptors.push(function (req, next) {
	const timeout = setTimeout(() => {
		next(req.respondWith(JSON.stringify({
			code: 408,
			message: 'Network Error',
		}), {
			status: 408,
			statusText: 'Timeout',
		}));
	}, 60000);
	next((resp) => {
		clearTimeout(timeout);
		if (resp.status === 401) {
			window.location.reload();
		} else if (resp.status >= 500) {
			resp.message = 'Internal Error';
		} else if (resp.status === 429) {
			resp.message = 'Request Too Frequent';
		} else {
			try {
				resp.data = JSON.parse(resp.body);
			} catch (e) {
				resp.message = 'Internal Error';
			}
		}
	});
});

FastClick.attach(document.body);

new Vue({
	router,
	render: h => h(App),
}).$mount('app');

