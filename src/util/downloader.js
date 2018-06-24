import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { localDate } from './local-date';

function generateFilename(name, updated) {
    return 'survey-' + name.replace(/\W+/g, "_") + '-' + localDate(updated)
}

function downloadSurveyJSON(meta) {
    let filename = generateFilename(meta.name, meta.updated),
        survey = store.get(meta.survey),
        blob = JSON.stringify(survey);

    download(blob, filename, 'application/json');
}

function downloadSurveyCSV(meta) {
    let filename = generateFilename(meta.name, meta.updated),
        survey = store.get(meta.survey),
        rows = [];

    Object.keys(survey.sections).forEach(function(section_title) {
        var section = survey.sections[section_title];

        Object.keys(section.competencies).forEach(function(competency_id) {
            var competency = section.competencies[competency_id];

            var rating_text = '';
            if (competency.examples.hasOwnProperty(competency.rating)) {
                rating_text = competency.examples[competency.rating];
            }

            rows.push({
                'Name': survey.name,
                'Updated': localDate(survey.updated),
                'Type': survey.type,
                'Version': survey.version,
                'Section': section_title,
                'Category': competency.category,
                'Competency ID': competency_id,
                'Competency': competency.competency,
                'Rating': competency.rating,
                'Rating Text': rating_text,
                'Comment': competency.comment
            });
        });
    });

    let blob = Papa.unparse(rows, { quotes: true });

    download(blob, filename, 'text/csv');
}

function download(data, filename, type) {
    let options = { type: type },
        blob = new Blob([data], options);

    saveAs(blob, filename);
}

export {
    downloadSurveyJSON,
    downloadSurveyCSV
};
