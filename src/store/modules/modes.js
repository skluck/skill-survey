import Vue from 'vue';
import { GETTERS } from '../getters';
import { MUTATIONS } from '../mutations';

// initial state
const state = {
    view_mode: false,
    show_summary: false,
    toggle_upload: false,

    section_hidden: {}
}

// getters
const getters = {
    [GETTERS.MODES.UPLOAD_STATUS] (state) {
        return state.toggle_upload;
    },
    [GETTERS.MODES.VIEW_MODE] (state) {
        return state.view_mode;
    },
    [GETTERS.MODES.SUMMARY_MODE] (state) {
        return state.show_summary;
    },
    [GETTERS.MODES.SECTION_HIDDEN] (state) {
        return (section_id) => {
            if (state.section_hidden.hasOwnProperty(section_id)) {
                return (state.section_hidden[section_id] === true);
            }

            return false;
        }
    }
}

// actions
const actions = {
    toggleUploader ({ commit }) {
        commit(MUTATIONS.MODES.ENABLE_UPLOADER);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                commit(MUTATIONS.MODES.DISABLE_UPLOADER)
                resolve()
            }, 1000)
        })
    },

    enablePrintView (context) {
        context.commit(MUTATIONS.MODES.ENABLE_VIEW_MODE);
        context.commit(MUTATIONS.MODES.ENABLE_SUIMMARY_MODE);

        for (var id in context.state.section_hidden) {
            context.commit(MUTATIONS.MODES.SHOW_SECTION, id);
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                window.print();
                resolve()
            }, 500)
        })
    }
}

// mutations
const mutations = {
    [MUTATIONS.MODES.DISABLE_UPLOADER] (state) {
        state.toggle_upload = false;
    },

    [MUTATIONS.MODES.ENABLE_UPLOADER] (state) {
        state.toggle_upload = true;
    },

    [MUTATIONS.MODES.TOGGLE_VIEW_MODE] (state) {
        state.view_mode = !state.view_mode;
    },
    [MUTATIONS.MODES.ENABLE_VIEW_MODE] (state) {
        state.view_mode = true;
    },

    [MUTATIONS.MODES.TOGGLE_SUIMMARY_MODE] (state) {
        state.show_summary = !state.show_summary;
    },
    [MUTATIONS.MODES.ENABLE_SUIMMARY_MODE] (state) {
        state.show_summary = true;
    },

    [MUTATIONS.MODES.TOGGLE_SECTION] (state, section_id) {
        if (state.section_hidden.hasOwnProperty(section_id)) {
            state.section_hidden[section_id] = !state.section_hidden[section_id];
        } else {
            state.section_hidden[section_id] = true;
        }
    },
    [MUTATIONS.MODES.HIDE_SECTION] (state, section_id) {
        Vue.set(state.section_hidden, section_id, true);
    },
    [MUTATIONS.MODES.SHOW_SECTION] (state, section_id) {
        Vue.set(state.section_hidden, section_id, false);
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
