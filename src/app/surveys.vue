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

                    <template v-for="(source_http, source_title) in sources">
                        <div class="item">
                            <div class="right floated content">
                                <a class="ui tiny green icon button" @click="fetchBlankSurvey(source_http)">
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
                                    <input type="text" v-model="source" class="mr-3">

                                    <a class="ui tiny green icon button" @click="fetchBlankSurvey">
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
                            <template v-for="survey in surveys">
                                <tr>
                                    <td>
                                        <button class="ui tiny primary icon button" @click="loadSurvey(survey)">
                                            <i class="download icon"></i> Load
                                        </button>
                                    </td>
                                    <td>{{ survey.name }}</td>
                                    <td>
                                        {{ survey.type }}
                                        <span class="ui tiny basic label">{{ survey.version }}</span>
                                        <span class="ui tiny basic label"><i class="clock icon"></i>{{ survey.updated|localDate }}</span>
                                    </td>
                                    <td class="right aligned">
                                        <button class="ui tiny teal icon button" @click="downloadSurvey(survey)">
                                            <i class="cloud download icon"></i> Backup
                                        </button>
                                        <button class="ui tiny teal icon button" @click="downloadSurveyCSV(survey)">
                                            <i class="cloud download icon"></i> CSV
                                        </button>

                                        <button class="ui tiny basic red icon button ml-3" @click="deleteSurvey(survey)">
                                            <i class="trash icon"></i>
                                        </button>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </template>

                <button class="ui icon orange button float-right" @click="uploadSurvey">
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
import message from '../util/message'

function getURLParameter(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' ')).replace('\u200E', '');
}

export default {
    name: 'Surveys',

    components: {
      message
    },

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
};
</script>
