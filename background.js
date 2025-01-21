// background.js

async function generateNotes(transcriptText, apiKey, model, tabId) {
  console.log("Generating notes for the transcript:", transcriptText);

  // Extract the course title from the page in the context of the tab
  const courseTitle = await new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        // Target the lecture item that is currently active
        const currentItem = document.querySelector('li[class*="curriculum-item-link--is-current"] div[class*="curriculum-item-link--item-container-"]');

        if (currentItem) {
          // Use explicit selectors to extract the title and duration
          const lectureTitleElem = currentItem.querySelector('div.curriculum-item-link--curriculum-item-title--VBsdR span');
          const lectureDurationElem = currentItem.querySelector('div.curriculum-item-link--metadata--XK804 span');

          if (lectureTitleElem && lectureDurationElem) {
            const lectureTitle = lectureTitleElem.innerText.trim();
            const lectureDuration = lectureDurationElem.innerText.trim();
            return `Lecture ${lectureTitle} (${lectureDuration})`;
          }
        }

        return 'Unknown Lecture Title';
      }
    }, (injectionResults) => {
      if (injectionResults && injectionResults.length > 0) {
        resolve(injectionResults[0].result);
      } else {
        reject('Failed to extract course title');
      }
    });
  });

  const apiEndpoint = "https://api.openai.com/v1/chat/completions";
  const messages = [
    {
      role: "system",
      content: `You are a helpful Student Notes taking Assistant. Today's date is ${new Date().toISOString().slice(0, 10)}.`
    },
    {
      role: "assistant",
      content: `Ok.`
    },
    {
      role: "user",
      content: `Generate Markdown Notes\nDescription: Convert the following transcript into detailed notes with code examples in markdown format.\n---\n${transcriptText}\n---\nConsidering the student is a novice.\n Wherever possible use a analogy to explain the concept. Also, generate mermaidjs mardown based diagrams wherever possible.`
    }
  ];

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
    });

    const data = await response.json();
    const generatedNotes = data.choices[0].message.content;

    // Prepend course title to the generated notes
    const finalNotes = `## ${courseTitle}\n\n${generatedNotes}`;
    return finalNotes;

  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generateNotes") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id; // Capture the current tab ID

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          // Extract transcript from the page
          const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
          let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          // Check if the element exists and includes the 'transcript' class
          if (element && Array.from(element.classList).some(cls => cls.includes('transcript'))) {
            return element.innerText; // Return transcript text
          } else {
            return null; // Return null if transcript not found
          }
        },
      }, async (injectionResults) => {
        // Fetch API key and GPT model from storage
        chrome.storage.sync.get(['openAIKey', 'gptModel'], async (data) => {
          const apiKey = data.openAIKey;
          const model = data.gptModel || 'text-davinci-003'; // Default model

          if (!apiKey) {
            console.error('API key is not set. Please set the API key in the options page.');
            return;
          }

          for (const frameResult of injectionResults) {
            console.log("frameResult.result",frameResult.result)
            // Check if we have valid transcript text
            if (frameResult.result) {
              try {
                const notes = await generateNotes(frameResult.result, apiKey, model, tabId); 
                sendResponse({ notes: notes });
              } catch (error) {
                console.error('Error generating notes:', error);
              }
            } else {
              sendResponse({ notes: "Transcript not found." }); // Inform popup that the transcript was not available
            }
          }
        });
      });
    });
    return true; // Indicates asynchronous response
  }
});
