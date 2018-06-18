<template>
    <div class="mb-5">
        <div class="ui segments">
            <h2 class="ui top attached block header">Save Survey</h2>
            <div class="ui segment">

                <message
                    :negative="save_last_message.error"
                    :value="save_last_message.message"></message>

                <div class="ui form">
                    <div class="four fields">
                        <div class="field">
                            <label>Survey name</label>
                            <input type="text" name="survey_name" v-model="changed_survey_name" placeholder="Example: John's Survey">
                        </div>
                        <div class="field">
                            <label>Survey type/version</label>
                            <div class="ui disabled input">
                                <input type="text" readonly :value="survey_type + ' [' + survey_version + ']'">
                            </div>
                        </div>
                        <div class="field">
                            <label>Last updated</label>
                            <div class="ui disabled input">
                                <input type="text" readonly :value="survey_updated">
                            </div>
                        </div>
                        <div class="field">
                            <label>Status</label>
                            <span v-if="survey_progress < 30" class="ui red label">{{ survey_progress }}% complete</span>
                            <span v-if="survey_progress >= 30 && survey_progress < 70" class="ui orange label">{{ survey_progress }}% complete</span>
                            <span v-if="survey_progress >= 70 && survey_progress < 100" class="ui yellow label">{{ survey_progress }}% complete</span>
                            <span v-if="survey_progress >= 100" class="ui green label">{{ survey_progress }}% complete</span>
                        </div>
                    </div>

                    <button class="ui green button" @click="saveSurvey">
                        <i class="icon save"></i> Save to Browser Storage
                    </button>

                    <button class="ui teal icon button ml-3" @click="downloadSurvey()">
                        <i class="cloud download icon"></i> Backup (JSON)
                    </button>

                    <button class="ui teal icon button" @click="downloadSurveyCSV()">
                        <i class="cloud download icon"></i> CSV
                    </button>

                    <button class="ui teal icon button" @click="printView()">
                        <i class="print icon"></i> Print
                    </button>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import message from '../util/message';

export default {
    name: 'save',

    components: {
      message
    },

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
};
</script>
