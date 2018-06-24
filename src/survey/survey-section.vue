<template>
    <div class="ui basic segment">

        <div class="ui sticky blue inverted clearing segment">
            <button
                class="ui white mini icon button position-absolute no-print"
                v-hover-child="'blue'"
                @click="toggleSection({ section_id })">
                <i class="toggle icon" v-bind:class="{ on: !isHidden, off: isHidden }"></i>
            </button>

            <template v-if="isViewMode">
                <div v-if="progress < 100" class="ui label red float-right">Incomplete</div>
            </template>

            <h2 class="ui header mt-0 pl-5">{{ section.name }}</h2>
        </div>

        <div v-show="!isHidden">
            <div class="ui divided items">
                <template v-for="(comp, comp_title) in section.competencies">
                    <competency
                        v-on:set-competency="saveRating(section_id, comp_title, $event)"
                        :comp="comp"
                        :comp_title="comp_title"
                        :categories="categories"
                        :ratings="ratings"
                        :unratings="unratings"></competency>
                </template>
            </div>
        </div>

    </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import competency from './competency';

export default {
    name: 'SurveySection',

    components: {
      competency
    },

    props: [
        'section_id',
        'section',
        'categories',
        'ratings',
        'unratings'
    ],
    computed: {
        ...mapGetters('modes', [
            'isViewMode',
            'isSectionHidden'
        ]),

        isHidden () {
            return this.isSectionHidden(this.section_id);
        },

        progress () {
            return this.calculateProgress(this.section.completed, this.section.total);
        }
    },

    methods: {
        ...mapMutations('modes', [
            'toggleSection',
        ]),

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
};
</script>
