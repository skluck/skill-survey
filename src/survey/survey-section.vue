<template>
    <div class="ui basic segment">
        <div class="ui blue inverted clearing segment" v-sticky>
            <button
                class="ui white mini icon button position-absolute no-print"
                v-hover-child="'blue'"
                @click="toggleSection(section_id)">
                <i class="toggle icon" v-bind:class="{ on: section.show_section, off: !section.show_section }"></i>
            </button>

            <template v-if="view_mode">
                <div v-if="progress < 100" class="ui label red float-right">Incomplete</div>
            </template>

            <h2 class="ui header mt-0 pl-5">{{ section.name }}</h2>
        </div>

        <div v-show="section.show_section">
            <div class="ui divided items">
                <template v-for="(comp, comp_title) in section.competencies">
                    <competency
                        v-on:set-competency="saveRating(section_id, comp_title, $event)"
                        :comp="comp"
                        :comp_title="comp_title"
                        :categories="categories"
                        :ratings="ratings"
                        :unratings="unratings"
                        :view_mode="view_mode"></competency>
                </template>
            </div>
        </div>

    </div>
</template>

<script>
import competency from './competency';

export default {
    name: 'survey-section',

    components: {
      competency
    },

    props: [
        'section_id',
        'section',
        'view_mode',
        'categories',
        'ratings',
        'unratings'
    ],
    computed: {
        progress: function() {
            // Not currently used
            return this.calculateProgress(this.section.completed, this.section.total);
        },
        progress_style: function() {
            // Not currently used
            return {
                width: this.progress + '%'
            }
        }
    },
    methods: {
        toggleSection: function(section) {
            this.$emit('toggle-section', section);
        },
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
