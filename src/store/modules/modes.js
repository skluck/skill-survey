
// initial state
const state = {
    view_mode: false,
    show_summary: false,
    toggle_upload: false
}

// getters
const getters = {
    getUploadStatus: state => state.toggle_upload
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
    }
}

// mutations
const mutations = {
    disableUploader (state) {
        state.toggle_upload = false;
    },

    enableUploader (state) {
        state.toggle_upload = true;
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
