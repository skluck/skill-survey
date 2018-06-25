<template>
    <div>

        <message
            negative="1"
            :value="error"></message>

        <div class="ui segments mt-5">

            <h2 class="ui teal top attached block header">
                <i class="help icon"></i>
                <div class="content">
                    Start a new survey or load an existing survey below.
                </div>
            </h2>

            <div class="ui clearing segment">

                <div class="ui relaxed divided list">

                    <template v-for="(source_http, source_title) in blanks">
                        <div class="item">
                            <div class="right floated content">
                                <a class="ui tiny green icon button" @click="fetchNewSurvey(source_http)">
                                    <i class="plus icon"></i>
                                    Start
                                </a>
                            </div>
                            <div class="content">
                                <h4 class="header">{{ source_title }}</h4>
                                <div class="description t-medium">{{ source_http }}</div>
                            </div>
                        </div>
                    </template>

                    <div class="item">
                        <div class="content">
                            <h4 class="header">Custom</h4>
                            <div class="description t-medium">
                                <div class="ui fluid input">
                                    <input type="text" v-model="custom_source" class="mr-3">

                                    <a class="ui tiny green icon button" @click="fetchNewSurvey(custom_source)">
                                        <i class="plus icon"></i>
                                        Start
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <div class="ui segments mt-5">
            <h3 class="ui top attached block header">
                Surveys
                <div class="sub header">Surveys saved to local browser storage</div>
            </h3>
            <div class="ui clearing segment">

                <template v-if="surveys.length">
                    <table class="ui very basic celled table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Name</th>
                                <th>Survey</th>
                                <th></th>
                            </tr>
                          </thead>
                        <tbody>
                            <template v-for="meta in surveys">
                                <tr>
                                    <td>
                                        <button class="ui tiny primary icon button" @click="loadSurvey(meta)">
                                            <i class="download icon"></i> Load
                                        </button>
                                    </td>
                                    <td>{{ meta.name }}</td>
                                    <td>
                                        {{ meta.type }}
                                        <span class="ui tiny basic label">{{ meta.version }}</span>
                                        <span class="ui tiny basic label"><i class="clock icon"></i>{{ meta.updated|local_date }}</span>
                                    </td>
                                    <td class="right aligned">
                                        <button class="ui tiny teal icon button" @click="downloadSurveyJSON(meta)">
                                            <i class="cloud download icon"></i> Backup
                                        </button>
                                        <button class="ui tiny teal icon button" @click="downloadSurveyCSV(meta)">
                                            <i class="cloud download icon"></i> CSV
                                        </button>

                                        <button class="ui tiny basic red icon button ml-3" @click="confirmDeleteSurvey(meta)">
                                            <i class="trash icon"></i>
                                        </button>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </template>

                <button class="ui icon orange button float-right" @click="toggleUploader">
                    <i class="cloud upload icon"></i> Upload
                </button>

                <p v-if="surveys.length > 0" class="t-small">
                    <span class="ui label basic red t-tiny">
                        <i class="warning icon"></i>Be careful!
                    </span>
                    Surveys are stored in browser cache. Clearing your cache will delete your surveys!
                </p>
                <p v-else class="mt-2">
                    No saved surveys found!
                </p>

            </div>
        </div>
    </div>
</template>

<script>
import $ from 'jquery';
import { mapActions, mapGetters } from 'vuex';
import { GETTERS } from '../store/getters';
import { MUTATIONS } from '../store/mutations';
import message from './message';
import { downloadSurveyJSON, downloadSurveyCSV } from '../util/downloader';

export default {
    name: 'Surveys',

    components: {
      message
    },

    created: function() {
        this.fetchBlanks();
    },

    computed: {
        ...mapGetters('surveys', {
            surveys: GETTERS.SURVEYS.GET_SURVEYS,
            getSurvey: GETTERS.SURVEYS.GET_SURVEY,
        }),
        ...mapGetters('blanks', {
            blanks: GETTERS.BLANKS.GET_SOURCES,
            error: GETTERS.BLANKS.GET_ERROR,
        }),

        custom_source: {
            get () {
                return this.$store.state.blanks.custom_source;
            },
            set (value) {
                this.$store.commit('blanks/' + MUTATIONS.BLANKS.SET_CUSTOM_SOURCE, value);
            }
        }
    },

    methods: {
        ...mapActions('modes', [
            'toggleUploader'
        ]),
        ...mapActions('surveys', [
            'deleteSurvey',
        ]),
        ...mapActions('survey', [
            'initializeSurvey',
        ]),
        ...mapActions('blanks', [
            'fetchBlanks',
            'fetchNewSurvey'
        ]),

        confirmDeleteSurvey: function(meta) {
            let payload = {
                survey_id: meta.id,
                key: meta.survey
            };

            $('#delete-survey')
                .modal({ onApprove: () => this.deleteSurvey(payload) })
                .modal('show');
        },

        loadSurvey: function (meta) {
            let stored = this.getSurvey(meta.survey);

            this.initializeSurvey({
                id: meta.id,
                name: stored.name,
                updated: stored.updated,
                type: stored.type,
                version: stored.version,
                sections: stored.sections
            });
        },

        downloadSurveyJSON: function (value) {
            downloadSurveyJSON(value);
        },
        downloadSurveyCSV: function (value) {
            downloadSurveyCSV(value);
        }
    }
};
</script>
