<template>
    <div>
        <div id="delete-survey" class="ui small modal">
            <div class="header">Delete Survey</div>
            <div class="content">
                <p>Are you sure you want to delete this survey?</p>
            </div>
            <div class="actions">
                <div class="ui approve negative left labeled icon button"><i class="trash icon"></i> Delete</div>
                <div class="ui cancel button">Cancel</div>
            </div>
        </div>

        <div id="upload-survey" class="ui small modal">
            <div class="header">Upload Survey</div>
            <div class="content">

                <template v-if="errors.length > 0">
                    <div class="ui error message">
                        <h3 class="header">There are errors with your upload!</h3>
                        <ul v-for="error in errors" class="list">
                            <li>
                                <h5>{{ error.file }}</h5>
                                {{ error.text }}
                            </li>
                        </ul>
                    </div>
                </template>

                <div v-if="dropped.length > 0">
                    <template v-for="file in dropped">
                        <div class="ui basic compact segment p-1 my-0 mb-2">
                            <button class="ui mini red button mr-2" @click="removeUpload(file.name)">Cancel</button>
                            <span>{{ file.name }}</span>
                        </div>
                    </template>
                </div>

                <div class="dropzone" :class="dropzone_style"
                    @drop="uploadDrop"
                    @dragover="uploadHover"
                    @dragenter="uploadHover"
                    @dragleave="uploadHoverOff">
                    <h3 class="ui icon header w-100">
                        <i class="icon" :class="icon_style"></i>
                        <div class="content">
                            Drop files here or click to select from filesystem.
                            <div class="sub header">Only backups or shared surveys in JSON format are supported.</div>
                        </div>
                    </h3>

                    <input type="file" multiple accept="application/json" @change="uploadInputDrop"/>
                </div>
            </div>
            <div class="actions">
                <div class="ui approve positive left labeled icon button"><i class="cloud upload icon"></i> Upload</div>
                <div class="ui cancel button">Cancel</div>
            </div>
        </div>
    </div>
</template>

<script>
import $ from 'jquery';
import { mapGetters, mapActions } from 'vuex';
import { GETTERS } from '../store/getters';
import { generateUUID } from '../util/generate-uuid';

export default {
    name: 'Modals',

    data: () => {
        return {
            error: false,
            hovering: false,
            dropped: [],
            validated: [],
            errors: []
        };
    },
    computed: {
        ...mapGetters('modes', {
            uploadTrigger: GETTERS.MODES.UPLOAD_STATUS,
        }),

        icon_style: function() {
            return {
                warning: this.error,
                question: this.hovering && !this.error,
                'cloud upload': !this.hovering && !this.error
            }
        },
        dropzone_style: function() {
            return {
                'dropzone-error': this.error,
                'dropzone-hovering': this.hovering && !this.error
            }
        }
    },
    watch: {
        uploadTrigger (value) {
            if (value !== true) {
                return;
            }

            this.uploadSurveyConfirmation();
        }
    },
    methods: {
        ...mapActions('surveys', [
            'uploadSurveys'
        ]),

        uploadSurveyConfirmation: function() {
            $('#upload-survey')
                .modal({
                    onApprove : this.uploadFiles,
                    onDeny: this.clearFiles
                })
                .modal('show');
        },

        uploadHover: function() {
            this.hovering = true;
            this.error = false;
        },
        uploadHoverOff: function() {
            this.hovering = false;
        },
        uploadDrop: function(e) {
            e.preventDefault();
            e.stopPropagation();
            return this.onFileChange(e.dataTransfer.files);
        },
        uploadInputDrop: function(e) {
            e.preventDefault();
            e.stopPropagation();
            return this.onFileChange(e.target.files);
        },
        onFileChange: function(xfer) {
            this.hovering = false;

            var files = [];
            if (xfer.length < 1) {
                this.error = true;
                return;
            }

            for (var i = 0; i < xfer.length; i++) {
                var file = xfer.item(i);
                if (file.type === 'application/json') {
                    files.push(file);
                } else if (file.type === '') {
                    // Allow empty mime type for IE :(
                    files.push(file);
                } else {
                    this.error = true;
                    console.log(file.name + ' is invalid type: ' + file.type);
                    return;
                }
            }

            var maybeAddDroppedFile = function(file) {
                var found = undefined;
                this.dropped.forEach(function(f) {
                    if (f.name === file.name) {
                        found = f;
                    }
                });

                if (found === undefined) {
                    this.dropped.push(file);
                }
            };

            files.forEach(maybeAddDroppedFile.bind(this));
        },
        removeUpload: function(filename) {
            this.dropped = this.dropped.filter(function(f) {
                return (filename !== f.name);
            });
        },
        clearFiles: function() {
            this.validated = [];
            this.dropped = [];
            this.errors = [];
        },
        uploadFiles: function($element) {
            var that = this;
            this.validated = [];
            this.errors = [];

            var onLoader = function(filename) {
                return function(e) {
                    return that.uploadSurvey(filename, e);
                };
            };

            // Trigger upload and parsing of surveys.
            this.dropped.forEach(function(survey) {
                var reader = new FileReader(),
                    filename = survey.name;

                reader.onload = onLoader(filename);
                reader.readAsText(survey);
            });

            // Wait until all surveys to be finished.
            var iterations = 0,
                finish = function() {
                    clearInterval(waiterID);

                    if (this.validateUploads()) {
                        $element.closest('.modal').modal('hide');
                    }
                }.bind(this),
                waiter = function() {
                    iterations++;
                    var files = this.dropped.length,
                        finished = this.validated.length + this.errors.length;

                    if (finished === files) {
                        finish();
                    } else if (iterations > 10) {
                        finish();
                    }
                };

            var waiterID = setInterval(waiter.bind(this), 1000);
            return false;

        },
        validateUploads: function() {
            // success!
            if (this.dropped.length === this.validated.length) {
                this.uploadSurveys(this.validated);
                this.validated = [];
                this.dropped = [];
                this.errors = [];
                return true;
            }

            this.validated = [];
            return false;
        },

        uploadSurvey: function(filename, e) {
            try {
                var decoded = JSON.parse(e.target.result);
            } catch(exception) {
                this.errors.push({ file: filename, text: 'JSON Error: ' + exception });
                return;
            }

            var err = this.uploadValidate(decoded);
            if (err !== false) {
                this.errors.push({ file: filename, text: err });
                return;
            }

            var survey_id = generateUUID(),
                survey_key = 'survey-' + survey_id,
                meta = {
                    type: decoded.type,
                    version: decoded.version,

                    id: survey_id,
                    name: decoded.name,
                    updated: decoded.updated,

                    survey: survey_key
                },
                survey = {
                    type: meta.type,
                    version: meta.version,

                    name: meta.name,
                    updated: meta.updated,

                    sections: decoded.sections
                };

            this.validated.push({
                meta: meta,
                survey: survey
            });
        },
        uploadValidate: function(survey) {
            var missing = ['type', 'version', 'name', 'updated', 'sections']
                .filter(function(key) {
                    return !survey.hasOwnProperty(key);
                });

            if (missing.length > 0) {
                return "Survey data is invalid. The following properties are missing: (" + missing.join(', ') + ")";
            }

            return false;
        },
    }
};
</script>
