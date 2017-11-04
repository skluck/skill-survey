var generate_uuid = function() {
    // only needs to be random enough for local storage
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

var clipboard = new Clipboard('.clipboard-btn');

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

Vue.component('surveysection', {
    template: '#ss-section',
    props: [
        'section_id',
        'section',
        'categories',
        'ratings',
        'unratings'
    ],
    data: function() {
        return {
            new_competency: {
                'id': '',
                'category': '',
                'competency': '',
                'examples': {
                    '0': '',
                    '1': '',
                    '2': '',
                    '3': ''
                },
                'rating': '',
                'comment': ''
            }
        };
    },
    methods: {
        newCompetency: function() {
            return {
                'id': '',
                'category': '',
                'competency': '',
                'examples': {
                    '0': '',
                    '1': '',
                    '2': '',
                    '3': ''
                },
                'rating': '',
                'comment': ''
            };
        },
        deleteSection: function() {
            this.$emit('delete-section');
        },
        updateTitle: function(event) {
            this.section.name = event.target.value;
            this.$emit('input', this.section);
        },

        addCompetency: function() {
            this.section.competencies.push(this.newCompetency());
            this.$emit('input', this.section);
        },

        // triggered from nested update "set-competency" in competency
        updateCompetency: function(competency_id, value) {
            // console.log('triggered section update >>> from competency');
            this.section.competencies[competency_id] = value;
        }
    }
});

Vue.component('competency', {
    template: '#ss-competency',
    props: [
        'comp',
        'categories',
        'ratings'
    ],

    data: function() {
        return {
            changed_comp: {}
        }
    },
    created: function() {
        this.changed_comp = this.comp;
    },

    methods: {
        updateID: function(event) {
            this.changed_comp.id = event.target.value;
            this.$emit('set-competency', this.changed_comp);
        },
        updateTitle: function(event) {
            this.changed_comp.competency = event.target.value;
            this.$emit('set-competency', this.changed_comp);
        },
        updateCategory: function(event) {
            this.changed_comp.category = event.target.value;
            this.$emit('set-competency', this.changed_comp);
        },

        // triggered from nested update "set-rating" in rating
        updateRating: function(rating_score, value) {
            // console.log('triggered competency update >>> from rating');
            this.changed_comp.examples[rating_score] = value;
            this.$emit('set-competency', this.changed_comp);
        }
    }
});

Vue.component('rating', {
    template: '#ss-rating',
    props: [
        'score',
        'example'
    ],

    data: function() {
        return {
            changed_rating: ''
        }
    },
    created: function() {
        this.changed_rating = this.example;
    },

    methods: {
        emitRating: function(event) {
            this.changed_rating = event.target.value;
            this.$emit('set-rating', this.changed_rating);
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
    methods: {
        loadBlankSurvey: function () {
            this.$emit('load-new-survey');
        }
    }
});

var app = new Vue({
    el: '#ss-editor',

    data: {
        last_message:      { message: "", error: false },
        save_last_message: { message: "", error: false },

        survey: {},
        sections: [],

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

    computed: {
        serialized_survey: function() {
            var serialized = this.serializeSections(),
                survey_version = this.survey.version,
                survey_type = this.survey.type;

            return JSON.parse(JSON.stringify({
                version: survey_version,
                type: survey_type,

                id: "",
                name: "",
                updated: "",

                sections: serialized
            }));
        }
    },

    methods: {
        buildNewSurvey: function () {
            this.survey = {
                id: generate_uuid(),
                type: '',
                version: '1.0.0'
            };

            this.sections = [];
        },
        addSection: function() {
            this.sections.push({
                name: '',
                competencies: []
            });
        },
        deleteSection: function(section_id) {
            this.sections.splice(section_id, 1)
        },

        clearSurvey: function () {
            this.setBanner('');
            this.setSaveBanner('');
            this.sections = null;

            this.survey.type = '';
            this.survey.version = '';

            this.survey.id = '';
            this.survey.name = '';
            this.survey.updated = '';
        },

        serializeSections: function() {
            var serialized = {},
                section_id,
                section,
                competency;

            for (section_id in this.sections) {
                section = this.sections[section_id];
                serialized[section.name] = {
                    competencies: {}
                };

                for (comp_id in section.competencies) {
                    competency = section.competencies[comp_id];
                    serialized[section.name]['competencies'][competency.id] = competency;
                }
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
