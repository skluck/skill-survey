import 'semantic-ui-css/semantic.js';
import 'semantic-ui-css/semantic.css';
import './sass/utilities.scss';
import './sass/overrides.scss';

import Vue from 'vue';
import VueResource from 'vue-resource';
import store from './store'
import app from './app.vue';

import { localDate } from './util/local-date';
import { hoverChildDirective } from './directives/hover-child';
import { sectionStatus } from './filters/section-status';

Vue.directive('hover-child', hoverChildDirective);

Vue.filter('local_date', localDate);
Vue.filter('section_status', sectionStatus);

Vue.use(VueResource);

new Vue({
  el: '#app',
  store,
  render: h => h(app)
})
