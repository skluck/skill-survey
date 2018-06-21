<template>
    <h1 class="ui header">
        <i class="edit icon"></i>
        <div class="content">
            {{ survey.type }}
            <span class="ui basic black label">{{ survey.version }}</span>

            <h3 v-if="survey.name" class="ui sub header mt-2">
                {{ survey.name }}
                <span v-if="survey.updated" class="ui label"><i class="clock icon"></i>{{ survey.updated|local_date }}</span>
            </h3>

            <template v-else>
                <span class="ui basic red label"><i class="warning icon"></i> Survey not yet saved</span>
            </template>
        </div>
    </h1>
</template>

<script>
export default {
    name: 'SurveyHeader',

    props: ['survey']
};
</script>
