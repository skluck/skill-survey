<template>
    <div class="ui basic segment">

        <div class="ui sticky blue inverted clearing segment">
            <button
                class="ui white mini icon button position-absolute no-print"
                v-hover-child="'blue'"
                @click="toggleSection(section_id)">
                <i class="toggle icon" v-bind:class="{ on: !isHidden, off: isHidden }"></i>
            </button>

            <template v-if="isViewMode">
                <div v-if="progress < 100" class="ui label red float-right">Incomplete</div>
            </template>

            <h2 class="ui header mt-0 pl-5">{{ getSection(section_id).name }}</h2>
        </div>

        <div v-show="!isHidden">
            <div class="ui divided items">
                <template v-for="(comp, comp_title) in getSection(section_id).competencies">
                    <competency
                        :section="section_id"
                        :comp="comp"
                        :title="comp_title"></competency>
                </template>
            </div>
        </div>

    </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { GETTERS } from '../../store/getters';
import { MUTATIONS } from '../../store/mutations';
import competency from './competency';

export default {
    name: 'SurveySection',

    components: {
      competency
    },

    props: [
        'section_id'
    ],
    computed: {
        ...mapGetters('modes', {
            isViewMode: GETTERS.MODES.VIEW_MODE,
            isSectionHidden: GETTERS.MODES.SECTION_HIDDEN
        }),

        ...mapGetters('survey', {
            getSection: GETTERS.SURVEY.GET_SECTION
        }),

        isHidden () {
            return this.isSectionHidden(this.section_id);
        },

        progress () {
            let section = this.getSection(this.section_id);
            return this.calculateProgress(section.completed, section.total);
        }
    },

    methods: {
        ...mapMutations('modes', {
            toggleSection: MUTATIONS.MODES.TOGGLE_SECTION
        }),

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
};
</script>
