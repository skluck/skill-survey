var segment = window.location.hash,
    default_source = "http://kluck.engineering/skill-survey/blank-competencies.json";

Vue.component('ratings', {
  template: '#ratings',
  props: ['ratings', 'unratings']
})

Vue.component('categories', {
  template: '#categories',
  props: ['categories']
})

var app = new Vue({
    el: '#evaluator',

    data: {
        last_message: "",
        source:  segment.length > 0 ? segment.slice(1) : default_source,

        competencies: null,
        form: null,

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
        unrating_values: function() {
            return this.unratings.map(function(v) {
                return v.value;
            });
        }
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

            var bySection = {};
            response.data.forEach(function(entry) {
                if (!bySection.hasOwnProperty(entry.section)) {
                    bySection[entry.section] = [];
                }

                bySection[entry.section].push(entry);
            });

            this.competencies = bySection;
            this.buildFormData(response.data);
        },
        fetchError: function(response) {
            this.last_message = "Something terrible happened. Cannot load survey.";
        },

        clearData: function () {
            this.last_message = "";

            this.competencies = null;
            this.form = null;
        },

        clearRating: function(competencyID) {
            Vue.set(this.form, competencyID, "");
        },

        buildFormData: function(competencies) {
            this.form = {};
            competencies.forEach(function(entry) {
                Vue.set(this.form, entry.id, entry.rating);
            }, this);
        },

        hoverRating: function(event) {
            $(event.currentTarget).addClass('orange');
        },
        hoverRatingOff: function(event) {
            $(event.currentTarget).removeClass('orange');
        }
    }
});
