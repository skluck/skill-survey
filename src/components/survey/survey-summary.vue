<template>
    <div v-show="isSummaryMode">
        <div class="ui basic segment">

            <div class="ui orange inverted segment">
                <h2 class="ui header">Survey Summary</h2>
            </div>

            <div class="ui segments">
                <template v-for="(section, section_id) in sections">
                    <div class="ui segment grid mt-0">
                        <div class="ui three wide column">

                            <template v-if="section.completed == section.total">
                                <div class="ui label">{{ section.score }} / {{ section.total * 3 }}</div>
                            </template>
                            <template v-else>
                                <span class="ui basic red label"><i class="warning icon"></i> Incomplete</span>
                            </template>

                        </div>
                        <div class="ui thirteen wide column">
                            <h3 class="ui header">{{ section.name }} </h3>
                        </div>
                    </div>
                </template>

                <div class="ui grey segment grid mt-0">
                    <div class="ui three wide column">
                        <template v-if="survey_completed == survey_total">
                            <span class="ui label">{{ survey_score }} / {{ survey_total * 3 }}</span>
                        </template>
                        <template v-else>
                            <span class="ui basic red label"><i class="warning icon"></i> Incomplete</span>
                        </template>
                    </div>
                    <div class="ui thirteen wide column">
                        <h3 class="ui grey header">Total</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { GETTERS } from '../../store/getters';

export default {
    name: 'SurveySummary',

    computed: {
        ...mapGetters('modes', {
            isSummaryMode: GETTERS.MODES.SUMMARY_MODE
        }),
        ...mapGetters('survey', {
            sections: GETTERS.SURVEY.GET_SECTIONS,
            survey_score: GETTERS.SURVEY.GET_SCORE,
            survey_completed: GETTERS.SURVEY.GET_COMPLETED,
            survey_total: GETTERS.SURVEY.GET_TOTAL,
        })
    }
};
</script>
