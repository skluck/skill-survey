import $ from 'jquery';
import { MUTATIONS } from '../mutations';
import { GETTERS } from '../getters';
import { RATINGS, UNRATINGS } from '../../types/ratings';
import { generateUUID } from '../../util/generate-uuid';
import { calculateProgress } from '../../util/calculate-progress';

const RATINGS_VALUES = RATINGS.map((v) => v.value);
const UNRATINGS_VALUES = UNRATINGS.map((v) => v.value);

function normalizeSectionTitle(title) {
    return title.replace(/\W+/g, "_").toLowerCase();
}

function loadSections(sections) {
    var sanitized = {};

    for (var title in sections) {
        var id = normalizeSectionTitle(title);
        sanitized[id] = parseSection(title, sections[title]);
    }

    return sanitized;
}

function parseSection(title, section) {
    section.name = title;
    section.score = 0;
    section.completed = 0;
    section.total = Object.keys(section.competencies).length;

    return section;
}

function totalSection(competencies) {
    let completed = 0,
        score = 0;

    for (let comp_id in competencies) {
        let rating = competencies[comp_id]['rating'];

        if (RATINGS_VALUES.includes(rating)) {
            score += parseInt(rating);
            completed += 1;
        } else if (UNRATINGS_VALUES.includes(rating)) {
            completed += 1;
        }
    }

    return { completed, score };
}

function serializeSections(sections) {
    var serialized = {};

    for (var section_title in sections) {
        var section = sections[section_title];
        serialized[section.name] = {
            competencies: section.competencies
        };
    }

    return serialized;
}

function calculateSurvey(sections) {
    let completed = 0,
        total = 0,
        score = 0,
        progress = 0;

    for (let section in sections) {
        completed += sections[section].completed;
        total += sections[section].total;
        score += sections[section].score;
    }

    progress = calculateProgress(completed, total);

    return {
        score,
        completed,
        total,
        progress
    };
}

// initial state
const state = {
    loaded: false,

    id: '',

    type: '',
    version: '',

    name: '',
    updated: '',

    sections: {},

    survey_completed: 0,
    survey_total: 0,
    survey_score: 0,
    survey_progress_percent: 0
}

// getters
const getters = {
    [GETTERS.SURVEY.GET_META] (state) {
        return {
            id: state.id,
            name: state.name,
            updated: state.updated,

            type: state.type,
            version: state.version
        };
    },

    [GETTERS.SURVEY.GET_SECTIONS] (state) {
        return state.sections;
    },

    [GETTERS.SURVEY.GET_SECTION] (state) {
        return (id) => state.sections[id];
    },

    [GETTERS.SURVEY.IS_LOADED] (state) {
        return state.loaded;
    },

    [GETTERS.SURVEY.GET_PROGRESS] (state) {
        return state.survey_progress_percent;
    },

    [GETTERS.SURVEY.GET_SCORE] (state) {
        return state.survey_score;
    },

    [GETTERS.SURVEY.GET_COMPLETED] (state) {
        return state.survey_completed;
    },

    [GETTERS.SURVEY.GET_TOTAL] (state) {
        return state.survey_total;
    }
}

// actions
const actions = {
    initializeSurvey ({ dispatch, commit }, survey) {
        commit(MUTATIONS.SURVEY.LOAD_SURVEY);

        commit(MUTATIONS.SURVEY.SET_ID, survey.id);
        commit(MUTATIONS.SURVEY.SET_NAME, survey.name);

        commit(MUTATIONS.SURVEY.SET_TYPE, survey.type);
        commit(MUTATIONS.SURVEY.SET_VERSION, survey.version);

        commit(MUTATIONS.SURVEY.SET_UPDATED, survey.updated);
        commit(MUTATIONS.SURVEY.SET_SECTIONS, survey.sections);

        return new Promise((resolve, reject) => {
            dispatch('parseSections', survey.sections);
            setTimeout(() => {
                $('.ui.sticky').sticky({ debug: false });
                resolve()
            }, 1000)
        })
    },

    clearSurvey ({ commit }) {
        commit(MUTATIONS.SURVEY.UNLOAD_SURVEY);

        commit(MUTATIONS.SURVEY.SET_ID, '');
        commit(MUTATIONS.SURVEY.SET_TYPE, '');
        commit(MUTATIONS.SURVEY.SET_VERSION, '');

        commit(MUTATIONS.SURVEY.SET_NAME, '');
        commit(MUTATIONS.SURVEY.SET_UPDATED, '');
        commit(MUTATIONS.SURVEY.SET_SECTIONS, {});
    },

    parseSections ({ commit }, sections) {
        for (let title in sections) {
            let normalized = normalizeSectionTitle(title);

            commit('modes/' + MUTATIONS.MODES.SHOW_SECTION, normalized, { root: true });
            commit(MUTATIONS.SURVEY.CALCULATE_SECTION, normalized);
            commit(MUTATIONS.SURVEY.CALCULATE_SURVEY);
        }
    },

    saveRating ({ commit, state }, payload) {
        let section = payload.section,
            competency = payload.competency,
            rating = payload.rating,
            comment = payload.comment;

        commit(MUTATIONS.SURVEY.SET_RATING, { section, competency, rating });
        commit(MUTATIONS.SURVEY.SET_COMMENT, { section, competency, comment });

        return new Promise((resolve, reject) => {
            commit(MUTATIONS.SURVEY.CALCULATE_SECTION, section);
            commit(MUTATIONS.SURVEY.CALCULATE_SURVEY);
            resolve()
        })
    },

    saveSurvey ({ commit, state, dispatch }, new_name) {
        let survey_id = state.id,
            updated_time = new Date().toISOString();

        if (survey_id.length === 0) {
            survey_id = generateUUID();
        }

        commit(MUTATIONS.SURVEY.SET_NAME, new_name);
        commit(MUTATIONS.SURVEY.SET_UPDATED, updated_time);
        commit(MUTATIONS.SURVEY.SET_ID, survey_id);

        let key = 'survey-' + survey_id,
            meta = {
                type: state.type,
                version: state.version,

                id: survey_id,
                name: new_name,
                updated: updated_time,

                survey: key
            },
            survey = {
                type: state.type,
                version: state.version,

                name: new_name,
                updated: updated_time,

                sections: serializeSections(state.sections)
            };

        dispatch('surveys/saveSurvey', { key, meta, survey }, { root: true });
    }
}

// mutations
const mutations = {
    [MUTATIONS.SURVEY.LOAD_SURVEY] (state) {
        state.loaded = true;
    },

    [MUTATIONS.SURVEY.UNLOAD_SURVEY] (state) {
        state.loaded = false;
    },

    [MUTATIONS.SURVEY.SET_ID] (state, id) {
        state.id = id;
    },

    [MUTATIONS.SURVEY.SET_TYPE] (state, type) {
        state.type = type;
    },

    [MUTATIONS.SURVEY.SET_VERSION] (state, version) {
        state.version = version;
    },

    [MUTATIONS.SURVEY.SET_NAME] (state, name) {
        state.name = name;
    },

    [MUTATIONS.SURVEY.SET_UPDATED] (state, updated) {
        state.updated = updated;
    },

    [MUTATIONS.SURVEY.SET_SECTIONS] (state, sections) {
        state.sections = loadSections(sections);
    },

    [MUTATIONS.SURVEY.SET_RATING] (state, { section, competency, rating }) {
        state.sections[section].competencies[competency].rating = rating;
    },

    [MUTATIONS.SURVEY.SET_COMMENT] (state, { section, competency, comment }) {
        state.sections[section].competencies[competency].comment = comment;
    },

    [MUTATIONS.SURVEY.CALCULATE_SECTION] (state, section_id) {
        let completed, score,
            competencies = state.sections[section_id].competencies;

        ({ completed, score } = totalSection(competencies));

        state.sections[section_id].completed = completed;
        state.sections[section_id].score = score;
    },

    [MUTATIONS.SURVEY.CALCULATE_SURVEY] (state) {
        let results = calculateSurvey(state.sections);

        state.survey_completed = results.completed;
        state.survey_total = results.total;
        state.survey_score = results.score;
        state.survey_progress_percent = results.progress;
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
