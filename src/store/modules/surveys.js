import { MUTATIONS } from '../mutations';
import { GETTERS } from '../getters';
import {
    persistToStorage,
    saveSurveyToStorage,
    removeSurveyFromStorage,
    getSurveyFromStorage,
    retrieveFromStorage
} from '../../api/surveys';

// initial state
const state = {
    surveys: retrieveFromStorage()
}

// getters
const getters = {
    [GETTERS.SURVEYS.GET_SURVEYS] (state) {
        return state.surveys;
    },
    [GETTERS.SURVEYS.GET_SURVEY] (state) {
        return (key) => getSurveyFromStorage(key);
    },
};

// actions
const actions = {
    saveSurvey ({ commit, state }, { key, meta, survey }) {
        // Dedupe survey out of list of surveys
        let new_surveys = state.surveys.filter((stored) => {
            return (stored.id !== meta.id);
        });

        new_surveys.push(meta);

        persistToStorage(new_surveys);
        saveSurveyToStorage(key, survey);
        commit(MUTATIONS.SURVEYS.SET_SURVEYS, new_surveys);
    },

    deleteSurvey ({ commit, state }, { key, survey_id }) {
        // Dedupe survey out of list of surveys
        let new_surveys = state.surveys.filter((stored) => {
            return (stored.id !== survey_id);
        });

        removeSurveyFromStorage(key, new_surveys);
        commit(MUTATIONS.SURVEYS.SET_SURVEYS, new_surveys);
    },

    uploadSurveys ({ dispatch }, surveys) {
        surveys.forEach(({ meta, survey }) => {
            dispatch('saveSurvey',{ key: meta.survey, meta, survey })
        });
    }
};

// mutations
const mutations = {
    [MUTATIONS.SURVEYS.SET_SURVEYS] (state, surveys) {
        state.surveys = surveys;
    },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
