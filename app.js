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
            return (this.negative) ? 'attention' : 'checkmark';
        },
        tone: function() {
            return (this.negative) ? 'negative' : 'positive';
        }
    }
});

Vue.component('navigation', {
    template: '#ss-navigation',
    props: ['loaded_survey'],
    data: function() {
        return {
            show_summary: false,
            view_mode: false,
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
        toggleViewMode: function () {
            this.view_mode = !this.view_mode;
            this.$emit('toggle-view-mode', this.view_mode);
        }
    }
});

Vue.component('surveyheader', {
    template: '#ss-header',
    props: ['survey']
});

Vue.component('surveysummary', {
    template: '#ss-summary',
    props: [
        'show_summary',
        'sections',
        'survey_score',
        'survey_completed',
        'survey_total'
    ]
});

Vue.component('surveysection', {
    template: '#ss-section',
    props: [
        'section_id',
        'section',
        'view_mode',
        'categories',
        'ratings',
        'unratings',
        'survey_progress',
        'survey_progress_style'
    ],
    computed: {
        progress: function() {
            return this.calculateProgress(this.section.completed, this.section.total);
        },
        progress_style: function() {
            return {
                width: this.progress + '%'
            }
        }
    },
    methods: {
        toggleSection: function(section) {
            this.$emit('toggle-section', section);
        },
        saveRating: function(section, competency, value) {
            this.$emit('set-competency', {
                section: section,
                competency: competency,
                rating: value.rating,
                comment: value.comment
            });
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

Vue.component('competency', {
    template: '#ss-competency',
    props: [
        'comp',
        'comp_title',
        'categories',
        'ratings',
        'unratings',
        'view_mode'
    ],
    data: function() {
        return {
            changed_comment: ''
        }
    },
    created: function() {
        this.changed_comment = this.comp.comment;
    },

    computed: {
        unrating_values: function() {
            return this.unratings.map(function(v) {
                return v.value;
            });
        }
    },

    methods: {
        onChange: function (value) {
            this.$emit('set-competency', { rating: value, comment: this.changed_comment });
        },

        hoverRating: function(event) {
            $(event.currentTarget).addClass('orange')
              .children('.label').addClass('orange');
        },
        hoverRatingOff: function(event) {
            $(event.currentTarget).removeClass('orange')
            .children('.label').removeClass('orange');
        }
    },
    filters: {
        unratingDescription: function(value) {
            var match = this.unratings.find(function(unrating) {
                return (value === unrating.value);
            });

            if (match === undefined) {
                match = 'Unknown';
            } else {
                match = match.human;
            }

            return match;
        }
    }
});

Vue.component('save', {
    template: '#ss-save',
    data: function() {
        return {
            changed_survey_name: ''
        }
    },
    created: function() {
        this.changed_survey_name = this.survey_name;
    },
    props: [
        'save_last_message',
        'survey_name',
        'survey_type',
        'survey_version',
        'survey_updated',
        'survey_progress'
    ],

    methods: {
        saveSurvey: function () {
            this.$emit('save-survey', this.changed_survey_name);
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
    props: ['categories', 'selected_category'],
    filters: {
        abbrev: function(v) {
            return v.slice(0, 1);
        }
    }
});

Vue.component('surveys', {
    template: '#ss-surveys',
    props: ['surveys', 'value'],

    methods: {
        onInput: function (event) {
            this.$emit('input', event.target.value);
        },

        loadSurvey: function (value) {
            this.$emit('load-survey', value);
        },
        deleteSurvey: function (value) {
            this.$emit('delete-survey', value);
        },

        loadBlankSurvey: function () {
            this.$emit('load-new-survey');
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
        last_message:      { message: "", error: false },
        save_last_message: { message: "", error: false },

        source:  segment.length > 0 ? segment.slice(1) : default_source,

        survey: {
            id: '',

            type: '',
            version: '',

            name: '',
            updated: ''
        },

        view_mode: false,
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
                human: "Not applicable.",
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
            this.setBanner('');

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
            this.setBanner('Something terrible happened. Cannot load survey.');
        },
        fetchValidate: function(response) {
            if (response.headers.get('Content-Type') !== 'application/json') {
                this.setBanner('Blank survey data must be json.');
                return false;
            }

            var missing = ['type', 'version', 'name', 'updated', 'sections']
                .filter(function(key) {
                    return !response.data.hasOwnProperty(key);
                });

            if (missing.length > 0) {
                this.setBanner("Survey data is invalid. The following properties are missing: (" + missing.join(', ') + ")");
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

            this.setBanner('');
            this.setSaveBanner('');
            this.sections = null;

            this.survey.type = '';
            this.survey.version = '';

            this.survey.id = '';
            this.survey.name = '';
            this.survey.updated = '';

            this.watchers = [];
        },

        changeName: function(name) {
            this.survey.name = name;
        },
        toggleSection: function(section_id) {
            var current_view = this.sections[section_id].show_section;
            this.sections[section_id].show_section = !current_view
        },
        toggleSummary: function(show_summary) {
            this.show_summary = show_summary;
            for (var section_title in this.sections) {
                this.sections[section_title].show_section = !show_summary;
            }
        },
        toggleViewMode: function(view_mode) {
            this.view_mode = view_mode;
        },
        saveRating: function($event) {
            var section = $event.section,
                competency = $event.competency,
                rating = $event.rating,
                comment = $event.comment;

            this.sections[section]['competencies'][competency]['rating'] = rating;
            this.sections[section]['competencies'][competency]['comment'] = comment;
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
            section.show_section = true;
            section.total = Object.keys(section.competencies).length;

            return section;
        },
        totalSection: function(section, competencies) {
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
        saveSurvey: function(new_name) {
            this.setSaveBanner('');

            if (!store.enabled) {
                this.setSaveBannerError('Browser storage is not supported by your browser.', true);
                return;
            }

            if (new_name === 0) {
                this.setSaveBannerError('Please provide a name for this survey.', true);
                return;
            }

            if (new_name > 50) {
                this.setSaveBannerError('Survey name too long.', true);
                return;
            }

            this.survey.name = new_name;
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

            this.setSaveBanner('Survey saved.', false, true);
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
        },

        setBanner: function(message, error) {
            if (error === undefined) {
                error = true;
            }

            this.save_last_message = {
                message: message,
                error: error
            };
        },
        setSaveBanner: function(message, error, shouldPop) {
            error = (error === undefined) ? true : error;
            shouldPop = (shouldPop === undefined) ? false : shouldPop;

            this.save_last_message = {
                message: message,
                error: error
            };

            if (shouldPop && message.length > 0) {
                var clearBanner = this.setSaveBanner;
                setTimeout(function() { clearBanner(''); }, 3000);
            }
        },
        setSaveBannerError: function(message, shouldPop) {
            this.setSaveBanner(message, true, shouldPop);
        }
    }
});
