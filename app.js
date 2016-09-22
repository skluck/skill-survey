var app = new Vue({
    el: '#evaluator',

    data: {
        last_message: "",
        source: 'http://kluck.engineering/skill-survey/blank-competencies.json',
        competencies: null,
        form: null,
        ratings: [0, 1, 2, 3],
        unratings: [
            {
                value: "IDK",
                human: "I don't know",
                tip: "Peer reviews only!"
            },
            {
                value: "N/A",
                human: "Not applicable",
                tip: "Competency is not relevant to person's role."
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

            var onSuccess = function (response) {
                if (response.headers.get('Content-Type') !== 'application/json') {
                    this.last_message = "Blank survey data must be json.";
                    return;
                }

                this.competencies = response.data;
                this.form = {};
                this.competencies.forEach(function(entry) {
                    Vue.set(this.form, entry.id, entry.rating);
                }, this);
            },
            onError = function(response) {
                this.last_message = "Something terrible happened. Cannot load survey.";
            };

            this.$http({ url: this.source, method: 'GET' })
                .then(onSuccess, onError);
        },
        clearData: function () {
            this.last_message = "";

            this.competencies = null;
            this.form = null;
        },

        clearRating: function(competencyID) {
            Vue.set(this.form, competencyID, "");
        },

        hoverRating: function(event) {
            $(event.currentTarget).addClass('orange');
        },
        hoverRatingOff: function(event) {
            $(event.currentTarget).removeClass('orange');
        }
    }
});
