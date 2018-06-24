import Vue from 'vue';

// initial state
const state = {
    view_mode: false,
    show_summary: false,
    toggle_upload: false,

    section_hidden: {}
}

// getters
const getters = {
    getUploadStatus: state => state.toggle_upload,
    isViewMode: state => state.view_mode,
    isSummaryMode: state => state.show_summary,
    isSectionHidden: (state) => (section_id) => {
        if (state.section_hidden.hasOwnProperty(section_id)) {
            return (state.section_hidden[section_id] === true);
        }

        return false;
    }
}

// actions
const actions = {
    toggleUploader ({ commit }) {
        commit('enableUploader');
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                commit('disableUploader')
                resolve()
            }, 1000)
        })
    },

    enablePrintView (context) {
        context.commit('enableViewMode');
        context.commit('enableSummaryMode');

        for (var id in context.state.section_hidden) {
            context.commit('showSection', { section_id: id });
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
    disableUploader (state) {
        state.toggle_upload = false;
    },

    enableUploader (state) {
        state.toggle_upload = true;
    },

    toggleViewMode (state) {
        state.view_mode = !state.view_mode;
    },
    enableViewMode (state) {
        state.view_mode = true;
    },

    toggleSummaryMode (state) {
        state.show_summary = !state.show_summary;
    },
    enableSummaryMode (state) {
        state.show_summary = true;
    },

    toggleSection (state, payload) {
        if (state.section_hidden.hasOwnProperty(payload.section_id)) {
            state.section_hidden[payload.section_id] = !state.section_hidden[payload.section_id];
        } else {
            state.section_hidden[payload.section_id] = true;
        }
    },
    hideSection (state, payload) {
        Vue.set(state.section_hidden, payload.section_id, true);
    },
    showSection (state, payload) {
        Vue.set(state.section_hidden, payload.section_id, false);
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
