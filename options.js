// Save the API key and GPT model
document.getElementById('optionsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const openAIKey = document.getElementById('openAIKey').value;
    const gptModel = document.getElementById('gptModel').value;
    chrome.storage.sync.set({ openAIKey, gptModel }, function() {
        console.log('OpenAI API Key and GPT model saved.');
    });
});

// Load the API key and GPT model on options page load
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['openAIKey', 'gptModel'], function(data) {
        document.getElementById('openAIKey').value = data.openAIKey || '';
        document.getElementById('gptModel').value = data.gptModel || 'text-davinci-003';
    });
});
