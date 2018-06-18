<template>
    <div class="ui massive stackable container icon menu no-print">
        <div class="header item">Skill Assessment and<br>Performance Review Surveys</div>

        <a class="item" href="https://github.com/skluck/skill-survey"><i class="large github icon"></i></a>

        <template v-if="loaded_survey">
            <div class="ui right item t-std">

                <button class="ui icon orange button mr-3" @click="printView()">
                    <i class="print icon"></i>
                </button>

                <button class="ui vertical button mr-3"
                    v-bind:class="{ green: view_mode }"
                    @click="toggleViewMode()">
                    <i class="toggle icon" v-bind:class="{ on: view_mode, off: !view_mode }"></i>
                    Viewer
                </button>

                <button class="ui vertical button mr-3"
                    v-bind:class="{ blue: show_summary }"
                    @click="toggleSummary()">
                    <i class="toggle icon" v-bind:class="{ on: show_summary, off: !show_summary }"></i>
                    Summary
                </button>

                <div class="ui vertical animated basic negative button" @click="clearSurvey">
                    <div class="visible content"> <i class="icon trash"></i> Clear</div>
                    <div class="hidden content">Are you sure?</div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    name: 'Navigation',

    props: ['loaded_survey', 'show_summary', 'view_mode'],
    methods: {
        clearSurvey: function () {
            this.$emit('clear-survey')
        },
        toggleSummary: function () {
            this.$emit('toggle-summary', !this.show_summary);
        },
        toggleViewMode: function () {
            this.$emit('toggle-view-mode', !this.view_mode);
        },
        printView: function() {
            this.$emit('print-view');
        }
    }
};
</script>
