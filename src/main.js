import Vue from 'vue';
import app from './app.vue';

import localDate from './util/local-date';
import betterSticky from './util/better-sticky';

Vue.directive('sticky', {
    inserted: function (el) {
        betterSticky[0](el);
    }
});

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

new Vue({
  el: '#app',
  render: h => h(app)
})
