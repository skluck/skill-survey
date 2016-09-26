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
    props: ['sections', 'value'],
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
            this.$emit('set_competency', value)
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

var app = new Vue({
    el: '#ss-app',

    data: {
        last_message: "",
        source:  segment.length > 0 ? segment.slice(1) : default_source,

        sections: null,

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

    methods: {
        fetchData: function () {
            this.last_message = "";
            this.$http({ url: this.source, method: 'GET' })
                .then(this.fetchSuccess, this.fetchError);
        },
        fetchSuccess: function(response) {
            if (response.headers.get('Content-Type') !== 'application/json') {
                this.last_message = "Blank survey data must be json.";
                return;
            }

            this.sections = response.data.sections;
        },
        fetchError: function(response) {
            this.last_message = "Something terrible happened. Cannot load survey.";
        },

        clearData: function () {
            this.last_message = "";

            this.sections = null;
        },

        setRating: function(section, competency, value) {
            this.sections[section]['competencies'][competency]['rating'] = value;
        }

    }
});
