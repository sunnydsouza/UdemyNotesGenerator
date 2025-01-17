document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('optionsForm').addEventListener('submit', saveOptions);

function saveOptions(event) {
    event.preventDefault();

    const options = {
        gptModel: document.getElementById('gptModel').value,
        openAIKey: document.getElementById('openAIKey').value,
        autoGenerate: document.getElementById('autoGenerate').checked,
        showTranscript: document.getElementById('showTranscript').checked,
        showCourseContent: document.getElementById('showCourseContent').checked
    };

    chrome.storage.sync.set(options, () => {
        alert('Options saved.');
    });
}

function restoreOptions() {
    chrome.storage.sync.get(
        {
            gptModel: 'gpt-4o',  // Default value
            openAIKey: '',
            autoGenerate: false, // Default value
            showTranscript: false, // Default value
            showCourseContent: false // Default value
        },
        (options) => {
            document.getElementById('gptModel').value = options.gptModel || 'gpt-4o';
            document.getElementById('openAIKey').value = options.openAIKey || '';
            document.getElementById('autoGenerate').checked = options.autoGenerate;
            document.getElementById('showTranscript').checked = options.showTranscript;
            document.getElementById('showCourseContent').checked = options.showCourseContent;
        }
    );
}