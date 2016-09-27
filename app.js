var segment = window.location.hash,
    default_source = "http://kluck.engineering/skill-survey/blank-competencies.json";

Vue.component('message', {
    template: '#ss-message',
    props: ['negative', 'header', 'value'],
    computed: {
        icon: function() {
            return (this.negative === '1') ? 'attention' : 'attention';
        },
        tone: function() {
            return (this.negative === '1') ? 'negative' : 'info';
        }
    }
});

Vue.component('navigation', {
    template: '#ss-navigation',
    props: ['loaded_survey', 'value'],
    methods: {
        onInput: function (event) {
            this.$emit('input', event.target.value)
        },

        loadSurvey: function () {
            this.$emit('load-survey')
        },
        clearSurvey: function () {
            this.$emit('clear-survey')
        }
    }
});

Vue.component('ratings', {
  template: '#ss-ratings',
  props: ['ratings', 'unratings']
});

Vue.component('categories', {
    template: '#ss-categories',
    props: ['categories']
});

Vue.component('category', {
    template: '#ss-category',
    props: ['categories', 'selected_category']
});

Vue.component('competency', {
    template: '#ss-competency',
    props: [
        'comp',
        'comp_title',
        'categories',
        'ratings',
        'unratings'
    ],

    computed: {
        unrating_values: function() {
            return this.unratings.map(function(v) {
                return v.value;
            });
        }
    },

    methods: {
        onChange: function (value) {
            this.value = value;
            this.$emit('set-competency', value)
        },

        hoverRating: function(event) {
            $(event.currentTarget).addClass('orange')
              .children('.label').addClass('orange');
        },
        hoverRatingOff: function(event) {
            $(event.currentTarget).removeClass('orange')
            .children('.label').removeClass('orange');
        }
    }
});

Vue.directive('sticky', {
    inserted: function (el) {
        $(el)
            .sticky({
                offset: 20,
                bottomOffset: 20,
                observeChanges: true
            })
            .sticky('refresh');
    },
    componentUpdated: function (el) {
        // update all stickies when any single one is refreshed - avoids weirdness
        $('.ui.sticky').sticky('refresh');
    },
    update: function (el) {
        // update all stickies when any single one is refreshed - avoids weirdness
        $('.ui.sticky').sticky('refresh');
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

var app = new Vue({
    el: '#ss-app',

    data: {
        last_message: "",
        source:  segment.length > 0 ? segment.slice(1) : default_source,

        survey_type: '',
        survey_version: '',

        surveys: [],
        sections: null,
        watchers: [],

        categories: [
            {
                "name": "Skill",
                "description": "These competencies should be primarily scored based on the ability of the person to perform at a high level.",
                "style": "green"
            },
            {
                "name": "Knowledge",
                "description": "These competencies should be primarily scored based on retained knowledge and expertise of the person.",
                "style": "blue"
            },
            {
                "name": "Behavior",
                "description": "These competencies should be primarily scored based on ongoing behavior of the person.",
                "style": "yellow"
            }
        ],
        ratings: [
            {
                value: "0",
                human: "Limited experience or knowledge. May have some familiarity but no hands-on or professional experience."
            },
            {
                value: "1",
                human: "Has some experience or knowledge. Can perform with limited oversight and guidance."
            },
            {
                value: "2",
                human: "Has production-level experience and deep hands-on knowledge. Can effectively share knowledge and assist others."
            },
            {
                value: "3",
                human: "Expert-level. Fully autonomous and can deliver consistently with an exceptional degree of quality."
            },
        ],
        unratings: [
            {
                value: "IDK",
                human: "I don't know.",
                tip: "Peer reviews only!",
                extended: 'Does not have enough knowledge to judge or evaluate.',
                warning: true
            },
            {
                value: "N/A",
                human: "Not applicable",
                tip: "Not applicable or relevant to person's role or team.",
                extended: "Not applicable or relevant to person's role or team."
            }
        ]
    },
    computed: {
        countable_ratings: function() {
            return this.ratings.map(function(v) {
                return v.value;
            });
        },
        unrating_values: function() {
            return this.unratings.map(function(v) {
                return v.value;
            });
        },
        survey_progress: function() {
            var completed = total = percent = 0,
                section;

            if (this.sections === null) {
                return 0;
            }

            for (section in this.sections) {
                completed += this.sections[section].completed;
                total += this.sections[section].total;
            }

            return this.calculateProgress(completed, total);
        },
        survey_progress_style: function() {
            return {
                width: this.survey_progress + '%'
            }
        },
    },

    methods: {
        fetchData: function () {
            this.last_message = "";

            this.$http({
                url: this.source,
                method: 'GET'
            })
            .then(this.fetchSuccess, this.fetchError);
        },
        fetchSuccess: function(response) {
            if (!this.fetchValidate(response)) {
                return;
            }

            this.survey_type = response.data.type;
            this.survey_version = response.data.version;

            this.sections = this.loadSections(response.data.sections);
            this.watchSections();
        },
        fetchError: function(response) {
            this.last_message = "Something terrible happened. Cannot load survey.";
        },
        fetchValidate: function(response) {
            if (response.headers.get('Content-Type') !== 'application/json') {
                this.last_message = "Blank survey data must be json.";
                return false;
            }

            return true;
        },

        clearData: function () {
            this.watchers.forEach(function(unwatch) {
                unwatch();
            });

            this.last_message = "";
            this.sections = null;
            this.survey_type = '';
            this.survey_version = '';

            this.watchers = [];
        },

        saveRating: function(section, competency, value) {
            this.sections[section]['competencies'][competency]['rating'] = value;
        },

        loadSections: function(sections) {
            var sanitized = {},
                id = title = '';

            for (title in sections) {
                id = title.replace(/ /g, "_").toLowerCase();
                sanitized[id] = this.parseSectionState(title, sections[title]);
            }

            return sanitized;
        },
        watchSections: function() {
            var path = name = '',
                unwatch;

            for (name in this.sections) {
                path = ['sections', name, 'competencies'].join('.');

                unwatch = this.$watch(path, this.sectionWatcher(name), {deep: true});
                this.watchers.push(unwatch);
            }
        },
        sectionWatcher: function(section) {
            return function(old, competencies) {
                this.totalSection(section, competencies);
            }
        },
        parseSectionState: function(title, section) {
            section.name = title;
            section.score = 0;
            section.completed = 0;
            section.progress = 0;
            section.progress_style = { width: section.progress + '%' }
            section.show_section = true;
            section.total = Object.keys(section.competencies).length;

            return section;
        },
        totalSection: function(section, competencies) {
            // @todo load this on survey load - for read-only survey viewing
            var completed = score = 0,
                comp_id = rating = '';

            for (comp_id in competencies) {
                rating = competencies[comp_id]['rating'];
                if (this.countable_ratings.includes(rating)) {
                    score += parseInt(rating);
                    completed += 1;
                } else if(this.unrating_values.includes(rating)) {
                    completed += 1;
                }
            }
            this.sections[section].score = score;
            this.sections[section].completed = completed;
            this.sections[section].progress = this.calculateProgress(completed, this.sections[section].total);

            this.sections[section].progress_style.width = this.sections[section].progress + '%';
        },
        calculateProgress: function(completed, total) {
            var percent = 0;

            if (total === 0) {
                return percent;
            }

            percent = (completed/total) * 100;
            percent = Math.round(percent/5) * 5;

            if (percent > 100) {
                percent = 100;
            }

            return percent;
        }
    }
});
