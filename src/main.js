import $ from 'jquery';
import 'semantic-ui-css/semantic.js';
import 'semantic-ui-css/semantic.css';
import './sass/utilities.scss';
import './sass/overrides.scss';

import Vue from 'vue';
import VueResource from 'vue-resource';
import app from './app.vue';

import { localDate } from './util/local-date';

Vue.directive('hover-child', {
    bind: function (el, binding) {
        $(el)
            .on('mouseenter', function(event) {
                $(el).children('.icon').addClass(binding.value);
            })
            .on('mouseleave', function(event) {
                $(el).children('.icon').removeClass(binding.value);
            });
    }
});

Vue.filter('localDate', localDate);

Vue.filter('section_status', function (section) {
    if (!section.hasOwnProperty('score') || !section.hasOwnProperty('completed')) {
        return 'Unknown';
    }

    var maxScore = parseInt(section.completed) * 3;

    return section.score + ' / ' + maxScore;
});

Vue.use(VueResource);

new Vue({
  el: '#app',
  render: h => h(app)
})
