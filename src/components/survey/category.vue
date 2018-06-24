<template>
    <span>
        <template v-for="category in categories">
            <template v-if="selected_category == category.name">
                <b class="ui basic label"
                :data-tooltip="category.name"
                data-position="top center"
                data-inverted=""
                :class="category.style">{{ category.name | abbrev }}</b>
            </template>
        </template>
    </span>
</template>

<script>
export default {
    name: 'category',

    props: [
        'categories',
        'selected_category'
    ],

    filters: {
        abbrev: function(v) {
            return v.slice(0, 1);
        }
    }
};
</script>
