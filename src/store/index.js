import Vue from 'vue';
import Vuex from 'vuex';
import modes from './modules/modes';
import copy from './modules/copy'
import createLogger from 'vuex/dist/logger';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    modes,
    copy
  },
  strict: debug,
  plugins: debug ? [createLogger()] : []
})
