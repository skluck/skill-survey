var segment = window.location.hash,
    default_source = "http://kluck.engineering/skill-survey/blank-competencies.json";

var generate_uuid = function() {
    // only needs to be random enough for local storage
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

Vue.component('message', {
    template: '#ss-message',
    props: ['negative', 'header', 'value'],
    computed: {
        icon: function() {
            return (this.negative === '1') ? 'attention' : 'help';
        },
        tone: function() {
            return (this.negative === '1') ? 'negative' : 'info';
        }
    }
});

Vue.component('navigation', {
    template: '#ss-navigation',
    props: ['loaded_survey'],
    data: function() {
        return {
            show_summary: false
        };
    },
    methods: {
        clearSurvey: function () {
            this.$emit('clear-survey')
        },
        toggleSummary: function () {
            this.show_summary = !this.show_summary;
            this.$emit('toggle-summary', this.show_summary);
        },
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

Vue.component('surveys', {
    template: '#ss-surveys',
    props: ['surveys', 'value'],

    methods: {
        onInput: function (event) {
            this.$emit('input', event.target.value)
        },

        loadSurvey: function (value) {
            this.$emit('load-survey', value)
        },
        deleteSurvey: function (value) {
            this.$emit('delete-survey', value)
        },

        loadBlankSurvey: function () {
            this.$emit('load-new-survey')
        }
    }
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

Vue.filter('localdate', function (value) {
    if (value.length === 0) return '';
    if (typeof value !== 'string') return '';

    var d = new Date(value);

    return [
        d.getFullYear(),
        "0".concat(d.getMonth() + 1).slice(-2),
        "0".concat(d.getDate()).slice(-2)
    ].join('-');
});

Vue.filter('section_status', function (section) {
    if (!section.hasOwnProperty('score') || !section.hasOwnProperty('completed')) {
        return 'Unknown';
    }

    var maxScore = parseInt(section.completed) * 3;

    return section.score + ' / ' + maxScore;
});

var app = new Vue({
    el: '#ss-app',

    data: {
        last_message: "",
        save_last_message: "",

        source:  segment.length > 0 ? segment.slice(1) : default_source,

        survey: {
            id: '',

            type: '',
            version: '',

            name: '',
            updated: ''
        },

        show_summary: false,
        survey_completed: 0,
        survey_total: 0,
        survey_score: 0,


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
    created: function() {
        // load surveys from local storage
        this.loadSavedSurveys();
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
            var completed = total = percent = score = 0;

            if (this.sections === null) {
                return 0;
            }

            for (var section in this.sections) {
                completed += this.sections[section].completed;
                total += this.sections[section].total;
                score += this.sections[section].score;
            }

            this.survey_score = score;
            this.survey_completed = completed;
            this.survey_total = total;

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

            this.fetchSurvey(response.data);
        },
        fetchError: function(response) {
            this.last_message = "Something terrible happened. Cannot load survey.";
        },
        fetchValidate: function(response) {
            if (response.headers.get('Content-Type') !== 'application/json') {
                this.last_message = "Blank survey data must be json.";
                return false;
            }

            var missing = ['type', 'version', 'name', 'updated', 'sections']
                .filter(function(key) {
                    return !response.data.hasOwnProperty(key);
                });

            if (missing.length > 0) {
                this.last_message = "Survey data is invalid. The following properties are missing: (" + missing.join(', ') + ")";
                return false;
            }

            return true;
        },

        fetchSurvey: function(newSurvey) {
            this.survey.type = newSurvey.type;
            this.survey.version = newSurvey.version;

            this.survey.name = newSurvey.name;
            this.survey.updated = newSurvey.updated;

            this.sections = this.loadSections(newSurvey.sections);
            for (var section_title in this.sections) {
                this.totalSection(section_title, this.sections[section_title].competencies);
            }
            this.watchSections();
        },

        loadSurvey: function(meta) {
            var stored = store.get(meta.survey);

            this.survey.id = meta.id;
            this.fetchSurvey(stored);
        },

        deleteSurvey: function(meta) {
            this.surveys = this.surveys.filter(function(stored) {
                return (stored.id !== meta.id);
            });

            store.set('surveys', this.surveys);
            store.remove(meta.survey);
        },

        clearData: function () {
            this.watchers.forEach(function(unwatch) {
                unwatch();
            });

            this.last_message = "";
            this.save_last_message = "";
            this.sections = null;

            this.survey.type = '';
            this.survey.version = '';

            this.survey.id = '';
            this.survey.name = '';
            this.survey.updated = '';

            this.watchers = [];
        },

        toggleSummary: function(show_summary) {
            this.show_summary = show_summary;
            for (var section_title in this.sections) {
                this.sections[section_title].show_section = !show_summary;
            }
        },
        saveRating: function(section, competency, value) {
            this.sections[section]['competencies'][competency]['rating'] = value;
        },

        loadSections: function(sections) {
            var sanitized = {},
                id = title = '';

            for (title in sections) {
                id = title.replace(/\W+/g, "_").toLowerCase();
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
        },
        loadSavedSurveys: function() {
            var surveys = store.get('surveys');

            if (!Array.isArray(surveys)) {
                surveys = [];
            }

            this.surveys = surveys;
        },
        saveSurvey: function() {
            this.save_last_message = '';

            if (!store.enabled) {
                this.save_last_message = 'Browser storage is not supported by your browser.';
                return;
            }

            if (this.survey.name.length === 0) {
                this.save_last_message = 'Please provide a name for this survey.';
                return;
            }

            if (this.survey.name.length > 50) {
                this.save_last_message = 'Survey name too long.';
                return;
            }

            this.survey.updated = new Date().toISOString();
            if (this.survey.id === undefined || this.survey.id.length === 0) {
                this.survey.id = generate_uuid();
            }

            var survey_key = 'survey-' + this.survey.id,
                serialized = this.serializeSections(),
                meta = {
                    type: this.survey.type,
                    version: this.survey.version,

                    id: this.survey.id,
                    name: this.survey.name,
                    updated: this.survey.updated,

                    survey: survey_key
                };

            // Dedupe survey out of list of surveys
            this.surveys = this.surveys.filter(function(stored) {
                return (stored.id !== meta.id);
            });

            this.surveys.push(meta);

            store.set('surveys', this.surveys);

            store.set(survey_key, {
                type: meta.type,
                version: meta.version,

                name: meta.name,
                updated: meta.updated,

                sections: serialized
            });

        },
        serializeSections: function() {
            var serialized = {},
                section_id, section;

            for (section_id in this.sections) {
                section = this.sections[section_id];
                serialized[section.name] = {
                    competencies: section.competencies
                };
            }

            return serialized;
        }
    }
});
