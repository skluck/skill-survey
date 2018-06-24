<template>
    <div>
        <div class="ui segments mt-5">
            <h3 class="ui top attached block header">
                Categories
                <div class="sub header">Competencies are categorized. These descriptions may help you understand how different categories should be rated.</div>
            </h3>
            <div class="ui segment" v-for="category in categories">
                <span :class="category.style" class="ui ribbon basic label">{{ category.name }}</span>
                {{ category.description }}
            </div>
        </div>

        <div class="ui segments my-5">
            <h3 class="ui top attached block header">
                Ratings
                <div class="sub header">The following legend describes how ratings translate to skill level.</div>
            </h3>

            <div class="ui segment" v-for="rating in ratings">
                <span class="ui grey ribbon label">{{ rating.value }}</span>
                {{ rating.human }}
            </div>

            <div v-if="unratings" class="ui grey segment">
                <h4 class="ui header">
                    Cannot evaluate a competency?
                    <div class="sub header">Not every competency will apply to every person or role. Use these options if no rating can be accurately specified.</div>
                </h4>

                <p v-for="rating in unratings">
                    <span class="ui basic grey inverted ribbon label">{{ rating.value }}</span>
                    <span v-if="rating.warning" class="ui left basic red label"><i class="warning icon"></i>{{ rating.tip }}</span>
                    {{ rating.extended }}
                </p>
            </div>
        </div>

        <div class="ui segments my-5">
            <h3 class="ui top attached block header">
                Frequently Asked Questions
                <div class="sub header">How do I use this thing?</div>
            </h3>

            <div class="ui segment">
                <h4 class="ui header">
                    <i class="help circle icon"></i>
                    <div class="content">How do I take surveys?</div>
                </h4>
                <p>
                    Start a survey by clicking <b class="ui tiny green label">start</b> next to a survey type at the top of the page.
                    Surveys can be saved at any time - including partially completed. If you don't want to complete a survey all in
                    one sitting, come back and finish it later! But don't forget to save your progress!
                </p>
                <h5 class="mt-0 mb-2">Don't see any survey options?</h5>
                <p>
                    Custom surveys can be loaded by entering the URL to load them from.
                </p>
            </div>
            <div class="ui grey segment">
                <h4 class="ui header">
                    <i class="help circle icon"></i>
                    <div class="content">How do I share my completed surveys?</div>
                </h4>
                <p>
                    Once you've completed a survey (or if you want to stop and come back to complete it later) you must <b class="ui tiny green label">save</b> it.
                    Surveys are saved to local browser storage in your <b>browser cache</b>. You can come back at any time and load the survey to view it.
                    We recommend using <b class="ui tiny label">viewer</b> mode for viewing surveys.
                </p>

                <h5 class="mt-0 mb-2">But what if you need to send this survey to a manager or peer?</h5>
                <p>
                    There are several ways to share surveys:
                    <ul class="ui bulleted list">
                        <li><b>Backup</b> - Download the survey as json, send or e-mail it to your peer and have them upload it through the app.</li>
                        <li><b>CSV</b> - Download the survey as CSV and view in a CSV viewer such as <b>Excel</b>.</li>
                        <li>
                            <b>Print (pdf)</b> - Once a survey is loaded, click the <b class="ui tiny orange label">print</b> icon in the top menu.
                            You can then save it as a pdf using your built-in browser functions.
                        </li>
                    </ul>
                </p>
            </div>
            <div class="ui grey segment">
                <h4 class="ui header">
                    <i class="help circle icon"></i>
                    <div class="content">How do I view completed surveys?</div>
                </h4>
                <p>
                    Saved surveys are shown in the table above. Click <b class="ui tiny blue label">load</b> to load and view a survey.
                    Once loaded you have several options available:
                </p>
                <ul class="ui list">
                    <li><b class="ui tiny label">Viewer</b> - Expand all sections and show scores and descriptions for each competency.</li>
                    <li><b class="ui tiny label">Summary</b> - Show total score for each section and entire survey.</li>
                    <li><b class="ui tiny orange label">Print</b> - Optimizes the survey view for printing or saving as PDF.</li>
                </ul>
            </div>
            <div class="ui grey segment">
                <h4 class="ui header">
                    <i class="help circle icon"></i>
                    <div class="content">How do I create surveys?</div>
                </h4>
                <p>
                    <b>Survey blanks</b> or templates must be stored in JSON and follow a preset format.
                    See <a href="http://kluck.engineering/skill-survey/sample-survey.json">sample-survey.json</a> for an example.

                    After it has been created, you can point the custom URL to your survey to use it as a template.
                </p>
                <p>
                    <b class="ui tiny pink label">New!</b> - A visual editor is provided to create surveys: <a href="editor.html">Visual Survey Editor</a>.
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { GETTERS } from '../store/getters';

export default {
    name: 'Introduction',

    computed: {
        ...mapGetters('copy', {
            categories: GETTERS.COPY.CATEGORIES,
            ratings: GETTERS.COPY.RATINGS,
            unratings: GETTERS.COPY.UNRATINGS
        })
    }
};
</script>

