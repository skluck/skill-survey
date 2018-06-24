<template>
    <div class="mb-5">
        <div class="ui segments">
            <h2 class="ui top attached block header">Save Survey</h2>
            <div class="ui segment">

                <message
                    :negative="banner.error"
                    :value="banner.message"></message>

                <div class="ui form">
                    <div class="four fields">
                        <div class="field">
                            <label>Survey name</label>
                            <input type="text" name="survey_name" v-model="changed_survey_name" placeholder="Example: John's Survey">
                        </div>
                        <div class="field">
                            <label>Survey type/version</label>
                            <div class="ui disabled input">
                                <input type="text" readonly :value="survey.type + ' [' + survey.version + ']'">
                            </div>
                        </div>
                        <div class="field">
                            <label>Last updated</label>
                            <div class="ui disabled input">
                                <input type="text" readonly :value="survey.updated">
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

                    <button class="ui green button" @click="saveSurveyToBrowser">
                        <i class="icon save"></i> Save to Browser Storage
                    </button>

                    <button class="ui teal icon button ml-3" @click="saveAndDownloadSurvey('json')">
                        <i class="cloud download icon"></i> Backup (JSON)
                    </button>

                    <button class="ui teal icon button" @click="saveAndDownloadSurvey('csv')">
                        <i class="cloud download icon"></i> CSV
                    </button>

                    <button class="ui teal icon button" @click="enablePrintView()">
                        <i class="print icon"></i> Print
                    </button>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { GETTERS } from '../store/getters';
import store from 'store';
import message from '../util/message';

export default {
    name: 'SaveOptions',

    components: {
      message
    },

    data: function() {
        return {
            changed_survey_name: ''
        }
    },
    created: function() {
        this.changed_survey_name = this.survey.name;
    },

    computed: {
        ...mapGetters('survey', {
            survey: GETTERS.SURVEY.GET_META,
            survey_progress: GETTERS.SURVEY.GET_PROGRESS,
        }),
        ...mapGetters('banners', {
            banner: GETTERS.BANNERS.GET_SAVE_BANNER,
        })
    },

    methods: {
        ...mapMutations('modes', [
            'enablePrintView',
        ]),
        ...mapActions('survey', [
            'saveSurvey',
        ]),
        ...mapActions('banners', [
            'saveBanner',
            'saveErrorBanner',
        ]),

        saveAndDownloadSurvey: function(type) {
            var meta = this.saveSurveyToBrowser(this.changed_survey_name);
            if (meta === false) {
                return;
            }

            if (type === 'csv') {
                downloadSurveyCSV(meta);
            } else if (type === 'json') {
                downloadSurveyJSON(meta);
            }
        },

        saveSurveyToBrowser: function() {
            let new_name = this.changed_survey_name;
            this.saveBanner({ message: '' });

            if (!store.enabled) {
                this.saveErrorBanner({ message: 'Browser storage is not supported by your browser.', shouldPop: true });
                return false;
            }

            if (new_name.length === 0) {
                this.saveErrorBanner({ message: 'Please provide a name for this survey.', shouldPop: true });
                return false;
            }

            if (new_name.length > 50) {
                this.saveErrorBanner({ message: 'Survey name too long.', shouldPop: true });
                return false;
            }

            this.saveSurvey(new_name);
            this.saveBanner({ message: 'Survey saved.', shouldPop: true });

            return true;
        },
    }
};
</script>
