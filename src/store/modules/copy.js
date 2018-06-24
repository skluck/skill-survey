import { CATEGORIES } from '../../types/categories';
import { RATINGS, UNRATINGS } from '../../types/ratings';

// initial state
const state = {
    categories: CATEGORIES,
    ratings: RATINGS,
    unratings: UNRATINGS
}

// getters
const getters = {
    rating_values: state => {
        return state.ratings.map((v) => v.value);
    },
    unrating_values: state => {
        return state.unratings.map((v) => v.value);
    },
    unrating_description: (state) => (value) => {
        var match = undefined;

        UNRATINGS.forEach((unrating) => {
            if (value === unrating.value) {
                match = unrating;
            }
        });

        if (match === undefined) {
            match = 'Unknown';
        } else {
            match = match.human;
        }

        return match;
    }
};

// actions
const actions = {};

// mutations
const mutations = {};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
