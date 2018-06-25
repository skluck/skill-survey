import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import banners from './modules/banners'
import blanks from './modules/blanks'
import copy from './modules/copy'
import modes from './modules/modes';
import survey from './modules/survey'
import surveys from './modules/surveys'

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    banners,
    blanks,
    copy,
    modes,
    survey,
    surveys
  },
  strict: debug,
  plugins: debug ? [createLogger()] : []
})
