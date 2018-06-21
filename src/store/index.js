import Vue from 'vue';
import Vuex from 'vuex';
import modes from './modules/modes';
// import products from './modules/products'
import createLogger from 'vuex/dist/logger';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    modes,
    // products
  },
  strict: debug,
  plugins: debug ? [createLogger()] : []
})
