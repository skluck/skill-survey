var generateUUID = function() {
    // only needs to be random enough for local storage
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

var localDate = function (value) {
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

var betterSticky = (function ($, window, document, undefined) {
    "use strict";

    var $doc = $(document);
    var sections = [];
    var slice = Function.prototype.call.bind([].slice);

    function debounce(fn, delay) {
      var pending;

      function deb() {
        if (pending) { clearTimeout(pending); }

        pending = setTimeout.apply(window, [fn, delay].concat(slice(arguments)));
      }

      return deb;
    }

    function offsetTop($el) {

      return $el.offsetParent().position().top;
    }

    function registerSticky(el) {
        sections.push($(el));
    }

    function scrollHandler(event, update) {
        var top = $doc.scrollTop();
        var current = sections
            .reduce(function (acc, sect) {

              return top > offsetTop(sect) ? sect : acc;
            }, 0)

        update(current);
    }

    function updateSticky(current) {
        var cssClass = 'global-sticky';

        $('.' + cssClass).remove();

        if (current) {
          var $clone = $(current)
              .clone();

          $clone
              .find('button')
              .on('click', function () {
                updateSticky(current);
                  // a small hack
                  current.find('button').click();
              });

          $('<div class="#" />'.replace('#', cssClass))
              .append($clone)
              .appendTo(document.body);
        }
    }

    document.addEventListener('scroll', function (event) {
      scrollHandler(event, debounce(updateSticky, 60));
    });

    return registerSticky;
}(jQuery, window, document));

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
                } else if (file.type === '') {
                    // Allow empty mime type for IE :(
                    files.push(file);
                } else {
                    this.error = true;
                    console.log(file.name + ' is invalid type: ' + file.type);
                    return;
                }
            }

            var maybeAddDroppedFile = function(file) {
                var found = undefined;
                this.dropped.forEach(function(f) {
                    if (f.name === file.name) {
                        found = f;
                    }
                });

                if (found === undefined) {
                    this.dropped.push(file);
                }
            };

            files.forEach(maybeAddDroppedFile.bind(this));
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
            var that = this;
            this.validated = [];
            this.errors = [];

            var onLoader = function(filename) {
                return function(e) {
                    return that.uploadSurvey(filename, e);
                };
            };

            // Trigger upload and parsing of surveys.
            this.dropped.forEach(function(survey) {
                var reader = new FileReader(),
                    filename = survey.name;

                reader.onload = onLoader(filename);
                reader.readAsText(survey);
            });

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

                    if (finished === files) {
                        finish();
                    } else if (iterations > 10) {
                        finish();
                    }
                };

            var waiterID = setInterval(waiter.bind(this), 1000);
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

            var survey_id = generateUUID(),
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
    props: ['loaded_survey', 'show_summary', 'view_mode'],
    methods: {
        clearSurvey: function () {
            this.$emit('clear-survey')
        },
        toggleSummary: function () {
            this.$emit('toggle-summary', !this.show_summary);
        },
        toggleViewMode: function () {
            this.$emit('toggle-view-mode', !this.view_mode);
        },
        printView: function() {
            this.$emit('print-view');
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
        'unratings'
    ],
    computed: {
        progress: function() {
            // Not currently used
            return this.calculateProgress(this.section.completed, this.section.total);
        },
        progress_style: function() {
            // Not currently used
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
            var match = undefined;
            this.unratings.forEach(function(unrating) {
                if (value === unrating.value) {
                    match = unrating;
                }
            });

            if (match === undefined) {
                match = 'Unknown';
            } else {
                match = match.human;
            }

            return match;
        },

        polyfill_includes: function(arr, search) {
            if (typeof arr.includes === 'function') {
                return arr.includes(search);
            } else {
                var filtered = arr.filter(function(element) {
                    return (element === search);
                });

                return (filtered.length === 1);
            }

            return false;
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
        },
        printView: function() {
            this.$emit('print-view');
        },
        downloadSurvey: function(value) {
            this.$emit('save-download-survey', this.changed_survey_name);
        },
        downloadSurveyCSV: function(value) {
            this.$emit('save-download-survey-csv', this.changed_survey_name);
        }
    }
});

Vue.component('introduction', {
    template: '#ss-introduction',
    props: ['categories', 'ratings', 'unratings']
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
            source: 'http://kluck.engineering/skill-survey/sample-survey.json',
            sources: {
                'Sample': 'http://kluck.engineering/skill-survey/sample-survey.json'
            },
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

            if (survey === null && segment.length > 0) {
                survey = segment.slice(1);
            }

            if (/^http(.*).json$/.test(survey)) {
                this.source = survey;
            }

            if (sources !== null && /^http(.*).json$/.test(sources)) {
                this.$http({ url: sources, method: 'GET' })
                .then(this.fetchSources);
            } else {
                this.$http({ url: 'surveys.json', method: 'GET' })
                .then(this.fetchSources);
            }
        },
        fetchSources: function(response) {
            if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
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

            this.$http({ url: source, method: 'GET' })
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
            if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
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
        betterSticky(el);
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
                this.totalSection(section_title);
            }
        },

        loadSurvey: function(meta) {
            var stored = store.get(meta.survey);

            this.survey.id = meta.id;
            this.loadNewSurvey(stored);
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
            this.setBanner('');
            this.setSaveBanner('');
            this.sections = null;

            this.survey.type = '';
            this.survey.version = '';

            this.survey.id = '';
            this.survey.name = '';
            this.survey.updated = '';
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

            this.totalSection(section);
        },

        loadSections: function(sections) {
            var sanitized = {};

            for (var title in sections) {
                var id = title.replace(/\W+/g, "_").toLowerCase();
                sanitized[id] = this.parseSectionState(title, sections[title]);
            }

            return sanitized;
        },

        parseSectionState: function(title, section) {
            section.name = title;
            section.score = 0;
            section.completed = 0;
            section.show_section = true;
            section.total = Object.keys(section.competencies).length;

            return section;
        },
        totalSection: function(section) {
            var completed = 0,
                score = 0,
                competencies = this.sections[section].competencies;

            for (var comp_id in competencies) {
                var rating = competencies[comp_id]['rating'];
                if (this.polyfill_includes(this.countable_ratings, rating)) {
                    score += parseInt(rating);
                    completed += 1;
                } else if (this.polyfill_includes(this.unrating_values, rating)) {
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
        saveAndDownloadSurvey: function(new_name, type) {
            var meta = this.saveSurvey(new_name);
            if (meta === undefined) {
                return;
            }

            if (type === 'csv') {
                this.downloadSurveyCSV(meta);
            } else if (type === 'json') {
                this.downloadSurvey(meta);
            }
        },

        saveSurvey: function(new_name) {
            this.setSaveBanner('');

            if (!store.enabled) {
                this.setSaveBannerError('Browser storage is not supported by your browser.', true);
                return;
            }

            if (new_name.length === 0) {
                this.setSaveBannerError('Please provide a name for this survey.', true);
                return;
            }

            if (new_name.length > 50) {
                this.setSaveBannerError('Survey name too long.', true);
                return;
            }

            this.survey.name = new_name;
            this.survey.updated = new Date().toISOString();
            if (this.survey.id === undefined || this.survey.id.length === 0) {
                this.survey.id = generateUUID();
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
            return meta;
        },
        serializeSections: function() {
            var serialized = {};

            for (var section_title in this.sections) {
                var section = this.sections[section_title];
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
            var storeUploadedFile = function(uploaded) {
                this.surveys.push(uploaded.meta);
                store.set(uploaded.meta.survey, uploaded.survey);
            };

            surveys.forEach(storeUploadedFile.bind(this));
            store.set('surveys', this.surveys);
        },

        downloadSurvey: function(meta) {
            var filename = 'survey-' + meta.name.replace(/\W+/g, "_") + '-' + localDate(meta.updated),
                survey = store.get(meta.survey),
                blob = JSON.stringify(survey);

            this.download(blob, filename, 'application/json');
        },
        downloadSurveyCSV: function(meta) {
            var filename = 'survey-' + meta.name.replace(/\W+/g, "_") + '-' + localDate(meta.updated),
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
                        'Updated': localDate(survey.updated),
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

            this.download(blob, filename, 'text/csv');
        },
        download: function download(data, filename, type) {
            var options = { type: type },
                blob = new Blob([data], options);

            saveAs(blob, filename);
        },
        printView: function() {
            this.toggleSummary(!this.show_summary);
            this.toggleViewMode(!this.view_mode);

            for (var section_title in this.sections) {
                this.sections[section_title].show_section = true;
            }

            setTimeout(function() { window.print(); }, 500);
        },

        polyfill_includes: function(arr, search) {
            if (typeof arr.includes === 'function') {
                return arr.includes(search);
            } else {
                var filtered = arr.filter(function(element) {
                    return (element === search);
                });

                return (filtered.length === 1);
            }

            return false;
        }
    }
});
