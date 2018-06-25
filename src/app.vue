<template>
    <div class="ui container my-3">
        <navigation
            :app_title="app_title"
            :app_secondary_title="app_secondary_title"
            :app_confluence_url="app_confluence_url"
            :app_github_url="app_github_url"></navigation>

        <modals></modals>

        <template v-if="isSurveyLoaded">
            <Survey></Survey>
        </template>

        <template v-else>
            <Surveys></Surveys>
            <Introduction></Introduction>
        </template>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { GETTERS } from './store/getters';

import Introduction from './components/introduction';
import Modals from './components/modals';
import Navigation from './components/navigation';
import Survey from './components/survey';
import Surveys from './components/surveys';

export default {
    name: 'app',

    components: {
        Introduction,
        Navigation,
        Modals,
        Survey,
        Surveys
    },
    data: function() {
        return {
            app_title: "Skill Survey",
            app_secondary_title: "Skill Assessment and Performance Review Surveys",
            app_github_url: "https://github.com/skluck/skill-survey",
            app_confluence_url: ""
        }
    },

    computed: {
        ...mapGetters('survey', {
            isSurveyLoaded: GETTERS.SURVEY.IS_LOADED,
        })
    }
};
</script>
