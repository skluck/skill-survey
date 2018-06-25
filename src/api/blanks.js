import Vue from 'vue'

const REQUIRED_FIELDS = [
    'type',
    'version',
    'name',
    'updated',
    'sections'
];

function loadSources(sourcesURL) {
    return Vue.http({ url: sourcesURL, method: 'GET' })
        .then((response) => parseSources(response));
}

function loadBlank(blankURL) {
    return Vue.http({ url: blankURL, method: 'GET' })
        .then((response) => validateBlank(response));
}

function parseSources(response) {
    if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
        return 'Blank survey data must be json.';
    }

    let sources = {};
    for (let groupName in response.data) {
        sources[groupName] = response.data[groupName];
    }

    return sources;
}

function validateBlank(response) {
    if (response.headers.get('Content-Type').indexOf('application/json') === -1) {
        return 'Blank survey data must be json.';
    }

    let missing = REQUIRED_FIELDS.filter(function(key) {
        return !response.data.hasOwnProperty(key);
    });

    if (missing.length > 0) {
        return "Survey data is invalid. The following properties are missing: (" + missing.join(', ') + ")";
    }

    return response.data;
}

export { loadSources, loadBlank };
