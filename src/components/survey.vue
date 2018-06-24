<template>
    <div>
        <SurveyHeader></SurveyHeader>
        <SurveySummary></SurveySummary>

        <template v-for="(section, section_id) in getSections">
            <SurveySection :section_id="section_id"></SurveySection>
        </template>

        <template v-if="!isViewMode">
            <SaveOptions></SaveOptions>
        </template>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { GETTERS } from '../store/getters';

import SurveyHeader from './survey/survey-header';
import SurveySummary from './survey/survey-summary';
import SurveySection from './survey/survey-section';
import SaveOptions from './save-options';

export default {
    name: 'survey',

    components: {
        SurveyHeader,
        SurveySummary,
        SurveySection,
        SaveOptions,
    },

    computed: {
        ...mapGetters('modes', {
            isViewMode: GETTERS.MODES.VIEW_MODE
        }),

        ...mapGetters('survey', {
            getSections: GETTERS.SURVEY.GET_SECTIONS,
        })
    }
};
</script>
