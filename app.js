var generate_uuid = function() {
    // only needs to be random enough for local storage
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

var localdate = function (value) {
    if (value.length === 0) return '';
    if (typeof value !== 'string') return '';

    var d = new Date(value);

    return [
        d.getFullYear(),
        "0".concat(d.getMonth() + 1).slice(-2),
        "0".concat(d.getDate()).slice(-2)
    ].join('-');
};

var getURLParameter = function (name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' ')).replace('\u200E', '');
}

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
Vue.component('modalers', {
    template: '#ss-modals',
    props: ['upload_trigger'],
    data: function() {
        return {
            error: false,
            hovering: false,
            dropped: [],
            validated: [],
            errors: []
        };
    },
    computed: {
        icon_style: function () {
            return {
                warning: this.error,
                question: this.hovering && !this.error,
                'cloud upload': !this.hovering && !this.error
            }
        },
        dropzone_style: function () {
            return {
                'dropzone-error': this.error,
                'dropzone-hovering': this.hovering && !this.error
            }
        }
    },
    watch: {
        upload_trigger: function(value) {
            if (value !== true) {
                return;
            }

            this.uploadSurveyConfirmation();
        }
    },
    methods: {
        uploadSurveyConfirmation: function() {
            $('#upload-survey')
            .modal({
                onApprove : this.uploadFiles,
                onDeny: this.clearFiles
            })
            .modal('show');
        },

        uploadHover: function() {
            this.hovering = true;
            this.error = false;
        },
        uploadHoverOff: function() {
            this.hovering = false;
        },
        uploadDrop: function(e) {
            e.preventDefault();
            e.stopPropagation();
            return this.onFileChange(e.dataTransfer.files);
        },
        uploadInputDrop: function(e) {
            e.preventDefault();
            e.stopPropagation();
            return this.onFileChange(e.target.files);
        },
        onFileChange: function(xfer) {
            this.hovering = false;

            var files = [];
            if (xfer.length < 1) {
                this.error = true;
                return;
            }

            for (var i = 0; i < xfer.length; i++) {
                var file = xfer.item(i);

                if (file.type === 'application/json') {
                    files.push(file);
                } else {
                    this.error = true;
                    console.log(file.name + ' is invalid type: ' + file.type);
                    return;
                }
            }

            for (var i in files) {
                var file = files[i];
                var found = this.dropped.find(function(f) {
                    return (f.name === file.name);
                });

                if (found === undefined) {
                    this.dropped.push(file);
                }
            }
        },
        removeUpload: function(filename) {
            this.dropped = this.dropped.filter(function(f) {
                return (filename !== f.name);
            });
        },
        clearFiles: function() {
            this.validated = [];
            this.dropped = [];
            this.errors = [];
        },
        uploadFiles: function($element) {
            this.validated = [];
            this.errors = [];

            var onLoader = function(filename) {
                return function(e) {
                    return this.uploadSurvey(filename, e);
                }.bind(this);
            }.bind(this);

            // Trigger upload and parsing of surveys.
            for (var id in this.dropped) {
                var reader = new FileReader(),
                    survey = this.dropped[id],
                    filename = survey.name;

                reader.onload = onLoader(filename);
                reader.readAsText(survey);
            }

            // Wait until all surveys to be finished.
            var iterations = 0,
                finish = function() {
                    clearInterval(waiterID);

                    if (this.validateUploads()) {
                        $element.closest('.modal').modal('hide');
                    }
                }.bind(this),
                waiter = function() {
                    iterations++;

                    var files = this.dropped.length,
                        finished = this.validated.length + this.errors.length;

                    if (files === finished) {
                        finish();
                    } else if (iterations > 10) {
                        finish();
                    }
                }.bind(this);

            var waiterID = setInterval(waiter, 1000);
            return false;

        },
        validateUploads: function() {

            // success!
            if (this.dropped.length === this.validated.length) {
                this.$emit('upload-surveys', this.validated);
                this.validated = [];
                this.dropped = [];
                this.errors = [];
                return true;
            }

            this.validated = [];
            return false;
        },

        uploadSurvey: function(filename, e) {
            try {
                var decoded = JSON.parse(e.target.result);
            } catch(exception) {
                this.errors.push({ file: filename, text: 'JSON Error: ' + exception });
                return;
            }

            var err = this.uploadValidate(decoded);
            if (err !== false) {
                this.errors.push({ file: filename, text: err });
                return;
            }

            var survey_id = generate_uuid(),
                survey_key = 'survey-' + survey_id,
                meta = {
                    type: decoded.type,
                    version: decoded.version,

                    id: survey_id,
                    name: decoded.name,
                    updated: decoded.updated,

                    survey: survey_key
                },
                survey = {
                    type: meta.type,
                    version: meta.version,

                    name: meta.name,
                    updated: meta.updated,

                    sections: decoded.sections
                };

            this.validated.push({
                meta: meta,
                survey: survey
            });
        },
        uploadValidate: function(survey) {
            var missing = ['type', 'version', 'name', 'updated', 'sections']
                .filter(function(key) {
                    return !survey.hasOwnProperty(key);
                });

            if (missing.length > 0) {
                return "Survey data is invalid. The following properties are missing: (" + missing.join(', ') + ")";
            }

            return false;
        },
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
        },
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
    props: ['surveys'],
    data: function() {
        return {
            default_source: 'http://kluck.engineering/skill-survey/sample-survey.json',
            source: '',
            sources: {},
            error: ''
        }
    },

    created: function() {
        this.loadSources();
    },
    methods: {
        loadSources: function() {
            var segment = window.location.hash,
                survey = getURLParameter('survey'),
                sources = getURLParameter('sources');

            if (survey === null) {
                survey = segment.length > 0 ? segment.slice(1) : this.default_source;
            }

            if (sources !== null) {
                this.$http({
                    url: sources,
                    method: 'GET'
                })
                .then(this.fetchSources);
            }

            this.source = survey;
        },
        fetchSources: function(response) {
            if (response.headers.get('Content-Type') !== 'application/json') {
                this.setBanner('Survey source list must be json.');
                return false;
            }

            var sources = {};
            for (var title in response.data) {
                sources[title] = response.data[title];
            }

            this.sources = sources;
        },

        fetchBlankSurvey: function (source) {
            this.setBanner('');
            if (typeof source !== 'string') {
                source = this.source;
            }

            this.$http({
                url: source,
                method: 'GET'
            })
            .then(this.fetchSuccess, this.fetchError);
        },
        fetchSuccess: function(response) {
            if (!this.fetchBlankValidate(response)) {
                return;
            }

            this.$emit('load-new-survey', response.data);
        },
        fetchError: function(response) {
            this.setBanner('Something terrible happened. Cannot load survey.');
        },
        fetchBlankValidate: function(response) {
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

        setBanner: function(message) {
            this.error = message;
        },

        loadSurvey: function (value) {
            this.$emit('load-survey', value);
        },
        deleteSurvey: function (value) {
            this.$emit('delete-survey', value);
        },
        downloadSurvey: function (value) {
            this.$emit('download-survey', value);
        },
        downloadSurveyCSV: function (value) {
            this.$emit('download-survey-csv', value);
        },
        uploadSurvey: function () {
            this.$emit('upload-survey');
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

Vue.filter('localdate', localdate);

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
        save_last_message: { message: "", error: false },

        survey: {
            id: '',

            type: '',
            version: '',

            name: '',
            updated: ''
        },

        view_mode: false,
        show_summary: false,
        toggle_upload: false,

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
        loadNewSurvey: function(newSurvey) {
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

        deleteSurveyConfirmation: function($event) {
            var deleter = this.deleteSurvey,
                actuallyDelete = function() { deleter($event); };

            $('#delete-survey')
            .modal({ onApprove : actuallyDelete })
            .modal('show');
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

            this.last_message = {
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
        },
        toggleUploader: function() {
            this.toggle_upload = true;
            var that = this,
                setBack = function() { that.toggle_upload = false; };

            setTimeout(setBack, 1000);
        },
        uploadSurveys: function(surveys) {
            for (var id in surveys) {
                var uploaded = surveys[id];
                this.surveys.push(uploaded.meta);

                store.set(uploaded.meta.survey, uploaded.survey);
            }

            store.set('surveys', this.surveys);
        },

        downloadSurvey: function(meta) {
            var filename = 'survey-' + meta.name.replace(/\W+/g, "_") + '-' + localdate(meta.updated),
                survey = store.get(meta.survey),
                blob = JSON.stringify(survey);

            this.download(blob, filename, 'application/json');
        },
        downloadSurveyCSV: function(meta) {
            var filename = 'survey-' + meta.name.replace(/\W+/g, "_") + '-' + localdate(meta.updated),
                survey = store.get(meta.survey),
                rows = [];

            Object.keys(survey.sections).forEach(function(section_title) {
                var section = survey.sections[section_title];

                Object.keys(section.competencies).forEach(function(competency_id) {
                    var competency = section.competencies[competency_id];

                    var rating_text = '';
                    if (competency.examples.hasOwnProperty(competency.rating)) {
                        rating_text = competency.examples[competency.rating];
                    }

                    rows.push({
                        'Name': survey.name,
                        'Updated': localdate(survey.updated),
                        'Type': survey.type,
                        'Version': survey.version,
                        'Section': section_title,
                        'Category': competency.category,
                        'Competency ID': competency_id,
                        'Competency': competency.competency,
                        'Rating': competency.rating,
                        'Rating Text': rating_text,
                        'Comment': competency.comment
                    });
                });
            });

            var blob = Papa.unparse(rows, { quotes: true });

            this.download(blob, filename, ' text/csv');
        },
        download: function download(data, filename, type) {
            var a = document.createElement('a'),
                file = new Blob([data], {type: type});

            if (window.navigator.msSaveOrOpenBlob) {
                // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            } else {
                var url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 0);
            }
        }
    }
});
