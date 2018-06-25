<template>
    <transition name="fade">
        <div class="mb-3" v-if="value">

            <div class="ui icon message" :class="tone">
                <i class="icon" :class="icon"></i>
                <div class="content">
                    <template v-if="header">
                        <div class="header">{{ header }}</div>
                    </template>
                    <p>{{ value }}</p>
                </div>
            </div>

        </div>
    </transition>
</template>

<script>
export default {
    name: 'message',

    props: [
        'negative',
        'header',
        'value'
    ],

    computed: {
        icon: function() {
            return (this.negative) ? 'attention' : 'checkmark';
        },
        tone: function() {
            return (this.negative) ? 'negative' : 'positive';
        }
    }
};
</script>
