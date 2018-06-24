<template>
    <div class="ui item stackable grid pb-0">

        <template v-if="isViewMode">
            <div class="ui two wide column">
                <div class="ui label">{{ comp_title }}</div>
                <category :categories="categories" :selected_category="comp.category"></category>
            </div>
            <div class="ui fourteen wide column">

                <h3 class="ui header mb-2">{{ comp.competency }}</h3>
                <div>
                    <template v-if="comp.rating === ''">
                        <span class="ui label basic red label">Competency not completed.</span>
                    </template>
                    <template v-else>
                        <template v-if="unrating_values.includes(comp.rating)">
                            <span class="ui black circular small label">{{ comp.rating }}</span>
                            {{ unrating_description(comp.rating) }}
                        </template>
                        <template v-else>
                            <b class="ui green circular small label">{{ comp.rating }}</b>
                            {{ comp.examples[comp.rating] }}
                        </template>
                    </template>
                </div>

                <div v-if="changed_comment" class="ui basic compact segment p-0 mb-0 mt-1">
                    <p class="t-small">
                        <b class="pr-2">Comment:</b> {{ changed_comment }}
                    </p>
                </div>

                <template v-if="comp.references">
                    <div class="ui basic compact segment p-0 mb-0 mt-1">
                        <b class="t-small pr-2">References:</b>
                        <div class="ui horizontal bulleted link list">
                            <template v-for="(reference_url, reference_title) in comp.references">
                                <a class="item t-small" :href="reference_url">{{ reference_title }}</a>
                            </template>
                        </div>
                    </div>
                </template>

            </div>

        </template>
        <template v-else>

            <div class="ui two wide column">
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
            <div class="ui fourteen wide column stackable grid">

                <div class="ui row">
                    <div class="ui eleven wide column">
                        <h3 class="ui header">{{ comp.competency }}</h3>

                        <template v-if="comp.rating === ''">

                            <template v-if="comp.references">
                                <div class="ui basic compact segment p-0 mb-0 mt-1">
                                    <b class="t-small pr-2">References:</b>
                                    <div class="ui horizontal bulleted link list">
                                        <template v-for="(reference_url, reference_title) in comp.references">
                                            <a class="item t-small" :href="reference_url">{{ reference_title }}</a>
                                        </template>
                                    </div>
                                </div>
                            </template>
                        </template>
                        <template v-else>
                            <div v-if="changed_comment" class="ui basic compact segment p-0 mb-0 mt-1">
                                <p class="t-small">
                                    <b>Comment:</b> {{ changed_comment }}
                                </p>
                            </div>
                        </template>

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
                    <div class="ui row p-0">
                        <div class="ui mini left icon input w-100">
                            <i class="comment icon"></i>
                            <input type="text" placeholder="Leave comment..." v-model="changed_comment">
                        </div>

                        <div class="ui items w-100">
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
        </template>
    </div>
</template>

<script>
import $ from 'jquery';
import { mapGetters, mapState } from 'vuex';
import category from './category'

export default {
    name: 'competency',

    components: {
      category
    },

    props: [
        'comp',
        'comp_title',
    ],

    data: function() {
        return {
            changed_comment: ''
        }
    },
    created: function() {
        this.changed_comment = this.comp.comment;
    },

    computed: {
        ...mapState('copy', [
            'unratings'
        ]),
        ...mapGetters('modes', [
            'isViewMode'
        ]),
        ...mapGetters('copy', [
            'unrating_values',
            'unrating_description'
        ]),
        ...mapState('copy', {
            categories: state => state.categories,
            ratings: state => state.ratings,
        })
    },

    methods: {
        onChange: function (value) {
            this.$emit('set-competency', { rating: value, comment: this.changed_comment });
        },

        hoverRating: function(event) {
            $(event.currentTarget).addClass('orange')
              .children('.label').addClass('orange');
        },
        hoverRatingOff: function(event) {
            $(event.currentTarget).removeClass('orange')
            .children('.label').removeClass('orange');
        }
    }
}
</script>
