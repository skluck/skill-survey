<template>
    <div class="ui container my-3">
        <navigation
            :loaded_survey="survey.type"
            :show_summary="show_summary"
            :view_mode="view_mode"
            v-on:clear-survey="clearData"
            v-on:toggle-summary="toggleSummary($event)"
            v-on:toggle-view-mode="toggleViewMode($event)"
            v-on:print-view="printView()"></navigation>

        <modals
            :upload_trigger="toggle_upload"
            v-on:upload-surveys="uploadSurveys"></modals>

        <template v-if="survey.type">

            <SurveyHeader :survey="survey"></SurveyHeader>

            <SurveySummary
                :show_summary="show_summary"
                :sections="sections"
                :survey_score="survey_score"
                :survey_completed="survey_completed"
                :survey_total="survey_total"
                :survey_progress="survey_progress"></SurveySummary>

            <template v-for="(section, section_id) in sections">
                <SurveySection
                    :section_id="section_id"
                    :section="section"
                    :view_mode="view_mode"
                    :categories="categories"
                    :ratings="ratings"
                    :unratings="unratings"
                    :survey_name="survey.name"
                    v-on:set-competency="saveRating($event)"
                    v-on:toggle-section="toggleSection($event)"></SurveySection>
            </template>

            <template v-if="!view_mode">
                <SaveOptions
                    :save_last_message="save_last_message"
                    :survey_type="survey.type"
                    :survey_version="survey.version"
                    :survey_updated="survey.updated"
                    :survey_progress="survey_progress"
                    :survey_name="survey.name"
                    v-on:save-survey="saveSurvey($event)"
                    v-on:change-survey-name="changeName($event)"
                    v-on:print-view="printView()"
                    v-on:save-download-survey="saveAndDownloadSurvey($event, 'json')"
                    v-on:save-download-survey-csv="saveAndDownloadSurvey($event, 'csv')"
                    ></SaveOptions>
            </template>

        </template>

        <template v-else>
            <Surveys
                :surveys="surveys"
                :loaded_survey="survey.type"
                v-on:load-new-survey="loadNewSurvey($event)"
                v-on:load-survey="loadSurvey($event)"
                v-on:delete-survey="deleteSurveyConfirmation($event)"
                v-on:download-survey="downloadSurvey($event)"
                v-on:download-survey-csv="downloadSurveyCSV($event)"
                v-on:upload-survey="toggleUploader"></Surveys>

            <Introduction
                :categories="categories"
                :ratings="ratings"
                :unratings="unratings"></Introduction>
        </template>
    </div>
</template>

<script>
import $ from 'jquery';
import Papa from 'papaparse';
import saveAs from 'file-saver';
import store from 'store';

import SurveyHeader from './survey/survey-header';
import SurveySummary from './survey/survey-summary';
import SurveySection from './survey/survey-section';
import Introduction from './app/introduction';
import Surveys from './app/surveys';
import Modals from './app/modals';
import Navigation from './app/navigation';
import SaveOptions from './app/save-options';

import { betterSticky } from './util/better-sticky';

export default {
    name: 'app',

    components: {
        Introduction,
        Navigation,
        Modals,
        Surveys,
        SurveyHeader,
        SurveySummary,
        SurveySection,
        SaveOptions
    },
    data: function() {
        return {
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
        }
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

            betterSticky[1]();
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
            this.toggleSummary(true);
            this.toggleViewMode(true);

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
};
</script>
