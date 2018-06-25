import { loadSources, loadBlank } from '../../api/blanks';
import { GETTERS } from '../getters';
import { MUTATIONS } from '../mutations';

const DEFAULT_SOURCES = window.location.origin + window.location.pathname + '/surveys.json';
const DEFAULT_SURVEY = window.location.origin + window.location.pathname + '/sample-survey.json';
const DEFAULT_BLANKS = {
    'Sample xxxx': DEFAULT_SURVEY
};

function getURLParameter(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' ')).replace('\u200E', '');
}

function getCustomSurveySourcesFromURL() {
    let customSources = getURLParameter('sources');
    if (customSources !== null && /^http(.*).json$/.test(customSources)) {
        return customSources;
    }

    return DEFAULT_SOURCES;
}

// initial state
const state = {
    sources: getCustomSurveySourcesFromURL(),
    custom_source: DEFAULT_SURVEY,
    blanks: DEFAULT_BLANKS,

    error: ''
}

// getters
const getters = {
    [GETTERS.BLANKS.GET_SOURCES] (state) {
        return state.blanks;
    },
    [GETTERS.BLANKS.GET_ERROR] (state) {
        return state.error;
    }
};

// actions
const actions = {
    fetchBlanks ({ commit }) {
        return new Promise((resolve, reject) => {
            loadSources(state.sources).then(blanks => {
                if (blanks === null) {
                    commit(MUTATIONS.BLANKS.SET_ERROR, 'Something terrible happened. Cannot load survey sources.');
                } else if(typeof blanks === 'string') {
                    commit(MUTATIONS.BLANKS.SET_ERROR, blanks);
                } else {
                    commit(MUTATIONS.BLANKS.SET_BLANKS, blanks);
                }
            });
        })
    },

    fetchNewSurvey ({ commit, dispatch }, source) {
        commit(MUTATIONS.BLANKS.SET_ERROR, '');

        return new Promise((resolve, reject) => {
            loadBlank(source).then(blank => {
                if (blank === null) {
                    commit(MUTATIONS.BLANKS.SET_ERROR, 'Something terrible happened. Cannot load survey.');
                } else if(typeof blank === 'string') {
                    commit(MUTATIONS.BLANKS.SET_ERROR, blank);
                } else {
                    let data = {
                        id: '',
                        name: '',
                        updated: '',
                        type: blank.type,
                        version: blank.version,
                        sections: blank.sections
                    };
                    dispatch('survey/initializeSurvey', data, { root: true });
                }
            });
        })
    },

    setError ({ commit }, message) {
        commit(MUTATIONS.BLANKS.SET_ERROR, message);
    }
};

// mutations
const mutations = {
    [MUTATIONS.BLANKS.SET_CUSTOM_SOURCE] (state, value) {
        state.custom_source = value;
    },
    [MUTATIONS.BLANKS.SET_BLANKS] (state, value) {
        state.blanks = value;
    },
    [MUTATIONS.BLANKS.SET_ERROR] (state, value) {
        state.error = value;
    }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
