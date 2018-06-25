import store from 'store';

function isStoreEnabled() {
    return store.enabled;
}

function persistToStorage(surveys) {
    store.set('surveys', surveys);
}

function saveSurveyToStorage(key, survey) {
    store.set(key, survey);
}

function removeSurveyFromStorage(key, surveys) {
    store.set('surveys', surveys);
    store.remove(key);
}

function getSurveyFromStorage(key) {
    return store.get(key);
}

function retrieveFromStorage() {
    let surveys = store.get('surveys');

    if (!Array.isArray(surveys)) {
        surveys = [];
    }

    return surveys;
}

export {
    isStoreEnabled,
    persistToStorage,
    saveSurveyToStorage,
    removeSurveyFromStorage,
    getSurveyFromStorage,
    retrieveFromStorage
};
