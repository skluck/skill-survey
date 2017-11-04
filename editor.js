var generate_uuid = function() {
    // only needs to be random enough for local storage
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

var clipboard = new Clipboard('.clipboard-btn'),
    buildNewSurvey = function() {
        return {
            id: generate_uuid(),
            type: '',
            version: '1.0.0'
        };
    }
    buildNewSection = function() {
        return {
            name: '',
            competencies: []
        };
    },
    buildNewCompetency = function() {
        return {
            id: '',
            category: 'Skill',
            competency: '',
            examples: [
                { rating: '0', example: ''},
                { rating: '1', example: ''},
                { rating: '2', example: ''},
                { rating: '3', example: ''}
            ],
            rating: '',
            comment: ''
        };
    },
    survey_ratings = [
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
    survey_unratings = [
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
    ],
    survey_categories = [
        {
            name: "Skill",
            description: "These competencies should be primarily scored based on the ability of the person to perform at a high level.",
            style: "green"
        },
        {
            name: "Knowledge",
            description: "These competencies should be primarily scored based on retained knowledge and expertise of the person.",
            style: "blue"
        },
        {
            name: "Behavior",
            description: "These competencies should be primarily scored based on ongoing behavior of the person.",
            style: "yellow"
        }
    ];

Vue.component('surveysection', {
    template: '#ss-surveysection',
    props: [
        'parent_section',
        'categories',
        'ratings'
    ],
    data: function() {
        return {
            section: {}
        }
    },
    created: function() {
        this.section = this.parent_section;
    },

    methods: {
        deleteCompetency: function(index) {
            this.section.competencies.splice(index, 1);
        },

        addCompetency: function() {
            this.section.competencies.push(buildNewCompetency());
        }
    }
});

Vue.component('competency', {
    template: '#ss-competency',
    props: [
        'parent_competency',
        'categories',
        'ratings'
    ],
    data: function() {
        return {
            competency: {}
        }
    },
    created: function() {
        this.competency = this.parent_competency;
    },
    methods: {
        resetExamples: function() {
            this.competency.examples[0]['example'] = survey_ratings[0].human;
            this.competency.examples[1]['example'] = survey_ratings[1].human;
            this.competency.examples[2]['example'] = survey_ratings[2].human;
            this.competency.examples[3]['example'] = survey_ratings[3].human;
        }
    }
});

Vue.component('example', {
    template: '#ss-example',
    props: [
        'parent_example',
        'score'
    ],
    data: function() {
        return {
            example: ""
        }
    },
    created: function() {
        this.example = this.parent_example;
    }
});


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

Vue.component('categories', {
    template: '#ss-categories',
    props: ['categories']
});

Vue.component('ratings', {
  template: '#ss-ratings',
  props: ['ratings', 'unratings']
});

var app = new Vue({
    el: '#ss-editor',

    data: {
        last_message: { message: "", error: false },
        survey: {},
        sections: [],

        categories: survey_categories,
        ratings: survey_ratings,
        unratings: survey_unratings
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
            this.survey = buildNewSurvey();
            this.sections = [];
        },
        addSection: function() {
            this.sections.push(buildNewSection());
        },
        deleteSection: function(index) {
            this.sections.splice(index, 1);
        },

        clearSurvey: function () {
            this.setBanner('');
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
                    serialized[section.name]['competencies'][competency.id] = {
                        category: '' + competency.category,
                        competency: competency.competency,
                        examples: {
                            '0': competency.examples[0].example,
                            '1': competency.examples[1].example,
                            '2': competency.examples[2].example,
                            '3': competency.examples[3].example
                        },
                        rating: '',
                        comment: ''
                    };
                }
            }

            return serialized;
        },

        setBanner: function(message, error) {
            if (error === undefined) {
                error = true;
            }

            this.last_message = {
                message: message,
                error: error
            };
        }
    }
});
