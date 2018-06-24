import { MUTATIONS } from '../mutations';
import { GETTERS } from '../getters';

// initial state
const state = {
    save_message: {
        message: "",
        error: false
    }
}

// getters
const getters = {
    [GETTERS.BANNERS.GET_SAVE_BANNER] (state) {
        return state.save_message;
    },
};

// actions
const actions = {
    saveBanner ({ dispatch, commit }, { message, shouldPop }) {
        commit(MUTATIONS.BANNERS.SAVE_BANNER, { message, error: false });

        if (shouldPop) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    dispatch('saveBanner', { message: '', shouldPop: false });
                    resolve()
                }, 3000)
            })
        }
    },

    saveErrorBanner ({ dispatch, commit }, { message, shouldPop }) {
        commit(MUTATIONS.BANNERS.SAVE_BANNER, { message, error: true });

        if (shouldPop) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    dispatch('saveBanner', { message: '', shouldPop: false });
                    resolve()
                }, 3000)
            })
        }
    },
};

// mutations
const mutations = {
    [MUTATIONS.BANNERS.SAVE_BANNER] (state, { message, error }) {
        state.save_message.message = message;
        state.save_message.error = error;
    },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
