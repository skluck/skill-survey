<template>
    <div class="ui massive stackable container icon menu no-print">
        <a class="item" :href="app_github_url"><i class="large github icon"></i></a>
        <div class="header item">{{ app_title }}</div>

        <template v-if="isSurveyLoaded">
            <div class="ui right item t-std">

                <button class="ui icon orange button mr-3" @click="enablePrintView()">
                    <i class="print icon"></i>
                </button>

                <button class="ui vertical button mr-3"
                    v-bind:class="{ green: isViewMode }"
                    @click="toggleViewMode()">
                    <i class="toggle icon" v-bind:class="{ on: isViewMode, off: !isViewMode }"></i>
                    Viewer
                </button>

                <button class="ui vertical button mr-3"
                    v-bind:class="{ blue: isSummaryMode }"
                    @click="toggleSummaryMode()">
                    <i class="toggle icon" v-bind:class="{ on: isSummaryMode, off: !isSummaryMode }"></i>
                    Summary
                </button>

                <div class="ui vertical animated basic negative button" @click="unloadSurvey">
                    <div class="visible content"> <i class="icon trash"></i> Clear</div>
                    <div class="hidden content">Are you sure?</div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { GETTERS } from '../store/getters';
import { MUTATIONS } from '../store/mutations';

export default {
    name: 'Navigation',

    props: [
        'app_title',
        'app_github_url',
    ],

    computed: {
        ...mapGetters('modes', {
            isViewMode: GETTERS.MODES.VIEW_MODE,
            isSummaryMode: GETTERS.MODES.SUMMARY_MODE
        }),
        ...mapGetters('survey', {
            isSurveyLoaded: GETTERS.SURVEY.IS_LOADED,
        })
    },

    methods: {
        ...mapMutations('modes', {
            toggleViewMode: MUTATIONS.MODES.TOGGLE_VIEW_MODE,
            toggleSummaryMode: MUTATIONS.MODES.TOGGLE_SUMMARY_MODE
        }),
        ...mapActions('modes', [
            'enablePrintView',
        ]),
        ...mapActions('survey', [
            'clearSurvey',
        ]),
        ...mapActions('banners', [
            'saveBanner',
        ]),

        unloadSurvey: function () {
            this.saveBanner({ message: '' });
            this.clearSurvey();
        }
    }
};
</script>
