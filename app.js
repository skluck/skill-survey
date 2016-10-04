<!doctype html>
<html data-framework="vue">
    <head>
        <meta charset="utf-8">
        <title>Skill Survey • Vue.js</title>

        <link rel="stylesheet" href="vendor/semantic-2.2.4.min.css"/>
        <link rel="stylesheet" href="utilities.css"/>

        <link rel="subresource" href="vendor/jquery-3.1.0.min.js"/>
        <link rel="subresource" href="vendor/semantic-2.2.4.min.js"/>
        <link rel="subresource" href="vendor/vue-2.0.0.js"/>
        <link rel="subresource" href="vendor/vue-resource-1.0.2.js"/>
        <link rel="subresource" href="vendor/store+json2-1.3.20.min.js"/>
        <link rel="subresource" href="app.js"/>

        <script>
            [
                'vendor/jquery-3.1.0.min.js',
                'vendor/semantic-2.2.4.min.js',
                'vendor/vue-2.0.0.js',
                'vendor/vue-resource-1.0.2.js',
                'vendor/store+json2-1.3.20.min.js',
                'app.js',
            ].forEach(function(src) {
                var script = document.createElement('script');
                script.src = src;
                script.async = false;
                document.head.appendChild(script);
            });
        </script>

        <style>
            .ui.sticky.bound.bottom {
                margin-bottom: 1em;
            }
            .ui.sticky.bound.bottom + div {
                margin-bottom: 2.5em;
            }

            .ui.button.white {
                color: black;
                background: #fff;
            }
        </style>
    </head>
    <body>
        <div class="ui container my-3" id="ss-app">
            <navigation
                :loaded_survey="survey.type"
                v-on:clear-survey="clearData"
                v-on:toggle-summary="toggleSummary($event)"></navigation>

            <message
                negative="1"
                :value="last_message"></message>

            <template v-if="survey.type">

                <h1 class="ui header">
                    <i class="edit icon"></i>
                    <div class="content">
                        {{ survey.type }}
                        <span class="ui basic black label">{{ survey.version }}</span>

                        <h3 v-if="survey.name" class="ui sub header mt-2">
                            {{ survey.name }}
                            <span v-if="survey.updated" class="ui label"><i class="clock icon"></i>{{ survey.updated|localdate }}</span>
                        </h3>
                        <template v-else>
                            <span class="ui basic red label"><i class="warning icon"></i> Survey not yet saved</span>
                        </template>
                    </div>
                </h1>

                <div v-show="show_summary">
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
                                            <span class="ui basic red label"><i class="warning icon"></i> Section incomplete</span>
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
                                        <span class="ui label">{{ survey_score }} / {{survey_total * 3 }}</span>
                                    </template>
                                    <template v-else>
                                        <span class="ui basic red label"><i class="warning icon"></i> Survey incomplete</span>
                                    </template>
                                </div>
                                <div class="ui thirteen wide column">
                                    <h3 class="ui grey header">Total</h3>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <template v-for="(section, section_id) in sections">
                    <div class="ui basic segment">

                        <div class="ui bound top sticky" v-sticky>
                            <div class="ui blue inverted clearing segment">
                                <button
                                    class="ui white mini icon button position-absolute"
                                    v-hover-child="'blue'"
                                    @click="section.show_section = !section.show_section"
                                >
                                    <i class="toggle icon" v-bind:class="{ on: section.show_section, off: !section.show_section }"></i>
                                </button>

                                <div class="ui teal progress my-0 float-right w-20">
                                    <div class="bar" v-bind:style="survey_progress_style">
                                        <div class="progress">{{ survey_progress }}%</div>
                                    </div>
                                    <div class="label top-0 text-trans">Overall</div>
                                </div>

                                <div class="ui green progress my-0 mx-2 float-right w-30">
                                    <div class="bar" v-bind:style="section.progress_style">
                                        <div class="progress">{{ section.progress }}%</div>
                                    </div>
                                    <div class="label top-0 text-trans">Section</div>
                                </div>

                                <h2 class="ui header mt-0 pl-5">{{ section.name }}</h2>
                            </div>
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
                                    ></competency>
                                </template>
                            </div>
                        </div>

                    </div>
                </template>

                <div class="mb-5">
                    <div class="ui segments">
                        <h2 class="ui top attached block header">Store Survey</h2>
                        <div class="ui segment">

                            <message
                                negative="1"
                                :value="save_last_message"></message>

                            <div class="ui form">
                                <div class="four fields">
                                        <div class="field">
                                            <label>Survey name</label>
                                            <input type="text" name="survey_name" v-model="survey.name" placeholder="Example: John's Survey">
                                        </div>
                                        <div class="field">
                                            <label>Survey type/version</label>
                                            <div class="ui disabled input">
                                                <input type="text" :value="survey.type + ' [' + survey.version + ']'">
                                            </div>
                                        </div>
                                        <div class="field">
                                            <label>Last updated</label>
                                            <div class="ui disabled input">
                                                <input type="text" :value="survey.updated">
                                            </div>
                                        </div>
                                        <div class="field">
                                            <label>Status</label>
                                            <span v-if="survey_progress < 30" class="ui red label">{{ survey_progress }}% complete</span>
                                            <span v-if="survey_progress >= 30 && survey_progress < 70" class="ui orange label">{{ survey_progress }}% complete</span>
                                            <span v-if="survey_progress >= 70 && survey_progress < 100" class="ui yellow label">{{ survey_progress }}% complete</span>
                                            <span v-if="survey_progress >= 100" class="ui green label">{{ survey_progress }}% complete</span>
                                        </div>
                                    </div>
                                </div>

                                <button class="ui green button" @click="saveSurvey">
                                    <i class="icon save"></i>
                                    Save to Browser Storage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </template>

            <template v-else>
                <surveys
                    :surveys="surveys"
                    :loaded_survey="survey.type"
                    v-on:load-new-survey="fetchData"
                    v-model="source"
                    v-on:load-survey="loadSurvey($event)"
                    v-on:delete-survey="deleteSurvey($event)"
                ></surveys>

                <categories :categories="categories"></categories>
                <ratings :ratings="ratings" :unratings="unratings"></ratings>
            </template>
        </div>

        <script type="text/x-template" id="ss-navigation">
            <div class="ui massive stackable icon menu">
                <div class="header item">Skill Evaluation and Competencies</div>

                <a class="item" href="https://github.com/skluck/skill-survey"><i class="large github icon"></i></a>

                <template v-if="loaded_survey">
                    <div class="right menu">
                        <div class="item">
                            <div class="ui mini input">
                                <button
                                    class="ui blue button"
                                    @click="toggleSummary()"
                                >
                                    <i class="toggle icon" v-bind:class="{ on: show_summary, off: !show_summary }"></i>

                                    <span v-if="show_summary">Hide Summary</span>
                                    <span v-else>Show Summary</span>
                                </button>

                            </div>

                        </div>
                        <div class="item">
                            <div class="ui mini input">
                                <div class="ui vertical animated basic negative button" @click="clearSurvey">
                                    <div class="visible content"> <i class="icon trash"></i> Clear</div>
                                    <div class="hidden content">Are you sure?</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </script>

        <script type="text/x-template" id="ss-message">
            <div v-if="value" class="ui icon message" :class="tone">
                <i class="icon" :class="icon"></i>
                <div class="content">
                    <template v-if="header">
                        <div class="header">{{ header }}</div>
                    </template>
                    <p>{{ value }}</p>
                </div>
            </div>
        </script>

        <script type="text/x-template" id="ss-surveys">
            <div>

                <div class="ui icon info message">
                    <i class="help icon"></i>
                    <div class="content">
                        <div v-if="surveys.length" class="header">
                            Start a new survey or load an existing survey below.
                        </div>
                        <div v-else class="header">
                            There are no saved surveys. Start a new survey below.
                        </div>

                        <div class="ui fluid action mini input my-3">
                            <input class="ui mini field" type="text" v-bind:value="value" v-on:input="onInput">
                            <button class="ui green right labeled icon button" @click="loadBlankSurvey">
                                <i class="plus icon"></i>
                                New Survey
                            </button>
                        </div>

                    </div>
                </div>

                <div v-if="surveys.length" class="ui segments mt-5">
                    <h2 class="ui top attached block header">Surveys</h2>
                    <div class="ui segment">

                        <template v-if="surveys.length">
                            <table class="ui very basic celled table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Survey</th>
                                        <th></th>
                                    </tr>
                                  </thead>
                                <tbody>
                                    <template v-for="survey in surveys">
                                        <tr>
                                            <td>{{ survey.name }}</td>
                                            <td>
                                                {{ survey.type }}
                                                <span class="ui tiny basic red label">{{ survey.version }}</span>
                                                <span class="ui tiny basic label"><i class="clock icon"></i>{{ survey.updated|localdate }}</span>
                                            </td>
                                            <td class="right aligned">
                                                <button class="ui primary icon button" @click="loadSurvey(survey)">
                                                    <i class="download icon"></i>
                                                </button>

                                                <button class="ui icon red button" @click="deleteSurvey(survey)">
                                                    <i class="trash icon"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </template>
                    </div>
                </div>
            </div>
        </script>

        <script type="text/x-template" id="ss-categories">
            <div v-if="categories" class="ui segments mt-5">
                <h2 class="ui top attached block header">Categories</h2>
                <div class="ui segment" v-for="category in categories">
                    <span :class="category.style" class="ui ribbon basic label">{{ category.name }}</span>
                    {{ category.description }}
                </div>
            </div>
        </script>

        <script type="text/x-template" id="ss-ratings">
            <div v-if="ratings" class="ui segments my-5">
                <h2 class="ui top attached block header">Ratings</h2>

                <div class="ui segment" v-for="rating in ratings">
                    <span class="ui grey ribbon label">{{ rating.value }}</span>
                    {{ rating.human }}
                </div>

                <div v-if="unratings" class="ui grey segment">
                    <h5 class="ui">Cannot Evaluate?</h5>

                    <p v-for="rating in unratings">
                        <span class="ui basic grey inverted ribbon label">{{ rating.value }}</span>
                        <span v-if="rating.warning" class="ui left basic red label"><i class="warning icon"></i>{{ rating.tip }}</span>
                        {{ rating.extended }}
                    </p>
                </div>
            </div>
        </script>

        <script type="text/x-template" id="ss-category">
            <span>
                <template v-for="category in categories">
                    <b v-if="selected_category == category.name" class="ui basic label" :class="category.style">{{ category.name }}</b>
                </template>
            </span>
        </script>

        <script type="text/x-template" id="ss-competency">
            <div class="ui item stackable grid pb-0">
                <div class="ui three wide column">
                    <div v-if="comp.rating === ''" class="ui label">{{ comp_title }}</div>
                    <div v-else class="ui green label position-relative">
                        <template v-if="comp.rating !== ''">
                            <span v-if="unrating_values.includes(comp.rating)" class="ui floating basic black circular mini label">{{ comp.rating }}</span>
                            <span v-else class="ui floating black circular mini label">{{ comp.rating }}</span>
                            {{ comp_title }}
                        </template>
                    </div>

                    <category :categories="categories" :selected_category="comp.category"></category>
                </div>
                <div class="ui thirteen wide column stackable grid">

                    <div class="ui row">
                        <div class="ui eleven wide column">
                            <h3 class="ui header">{{ comp.competency }}</h3>
                        </div>
                        <div class="ui five wide column">
                            <template v-if="comp.rating === ''">
                                <template v-for="rating in unratings">
                                    <label class="ui compact mini basic button right floated"
                                        @click="onChange(rating.value)"
                                        :data-tooltip="rating.tip"
                                        data-position="bottom center"
                                        @mouseover="hoverRating"
                                        @mouseout="hoverRatingOff">
                                        {{ rating.human }}
                                    </label>
                                </template>
                            </template>
                            <template v-else>
                                <label class="ui compact mini negative basic button right floated" @click="onChange('')">
                                    Clear
                                </label>
                            </template>
                        </div>
                    </div>

                    <template v-if="comp.rating === ''">
                        <div class="ui">
                            <div class="ui items">
                                <div class="item" v-for="rating in ratings">
                                    <label class="ui compact small message"
                                        @click="onChange(rating.value)"
                                        @mouseover="hoverRating"
                                        @mouseout="hoverRatingOff">
                                        <b class="ui label">{{ rating.value }}</b>
                                        {{ comp.examples[rating.value] }}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </script>
    </body>
</html>
