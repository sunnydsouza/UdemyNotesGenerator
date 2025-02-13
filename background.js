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
    // {
    //   role: "user",
    //   content: `Generate Markdown Notes\nDescription: Convert the following transcript into detailed notes with code examples in markdown format.\n---\n${transcriptText}\n---\nConsidering the student is a novice.\n Wherever possible use a analogy to explain the concept. Also, generate mermaidjs mardown based diagrams wherever possible.`
    // }
    // {
    //   role: "user",
    //   content: `Generate Markdown Notes with Detailed Index and Diagrams  
    //             Description: Convert the following transcript into comprehensive, beginner-friendly markdown notes. The notes should include:  
    //             1. A **clickable index** of topics covered, formatted for easy navigation in platforms like GitHub or Obsidian. The last entry in the index should always be a "Cheat Note Summary" of the lecture.  
    //             2. **In-depth explanations** of each topic from the transcript. Use clear and concise language, suitable for a novice audience.  
    //             3. **Analogies** wherever possible to simplify and clarify concepts.  
    //             4. **Code examples** relevant to the discussed concepts to enhance understanding.  
    //             5. **Mermaid.js diagrams** (e.g., flowcharts, sequence diagrams, or other appropriate visualizations) for complex topics, embedded in markdown format for better comprehension.  

    //             At the end of the notes, include a **Cheat Note Summary**, condensing the lecture into key takeaways, formulas, and examples for quick revision. Ensure the summary is also listed as a topic in the index.

    //             ---  
    //             Input Transcript:  
    //             ${transcriptText}  
    //             ---  

    //             Output Format:  
    //             - A well-structured Markdown document with sections aligned with the index.  
    //             - Clickable links in the index for each section, including the Cheat Note Summary.  
    //             - Clear topic explanations with examples, diagrams, and analogies.  
    //             - Mermaid.js diagrams embedded in Markdown syntax where applicable.  
    //             `
    // }

    {
      role: "user",
      content: `Generate Comprehensive Markdown Notes with Diagrams and Callout Blocks  
                Description: Transform the provided transcript into detailed, beginner-friendly markdown notes. Ensure the following key features are included:

                1. **Detailed Explanations**: Expand on each topic with in-depth explanations tailored for novices, using relatable analogies wherever possible.  
                2. **Mermaid Diagrams**: Include relevant mermaid.js diagrams (flowcharts, sequence diagrams, etc.) to visually represent concepts and workflows.  
                3. **Code Examples**: Provide illustrative code examples wherever applicable to solidify understanding.  
                4. **Callout Blocks**: Summarize key sections and include tips using pre-defined callout formats:  

                ---
                > [!SUMMARY] Cheat sheet 
                > Summarize the topic in a way useful for interview presparation  
                ---  
                > [!INFO]  
                > Here's a callout block.  
                > It supports **markdown** and [[Internal link|wikilinks]].  

                > [!TIP] Callouts can have custom titles, which also supports **markdown**!  
                ---  

                
                Input Transcript:  
                ---  
                ${transcriptText}  
                ---

                Instructions: 
                - Always precede/start with a Cheat Code section, which is a compressed summary, useful for interview prep on the topic 
                - Organize content into well-structured sections and subsections.  
                - Use clear and concise language suitable for beginners.  
                - Embed callout blocks wherever applicable.  
                - Ensure diagrams and code examples are well-formatted for Markdown rendering without additional block wrapping.
                - DO NOT WRAP blocks with  markdown code format
                `
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


// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "generateNotes") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const tabId = tabs[0].id; // Capture the current tab ID

//       chrome.scripting.executeScript({
//         target: { tabId: tabId },
//         function: () => {
//           // Extract transcript from the page
//           const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
//           let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
//           // Check if the element exists and includes the 'transcript' class
//           if (element && Array.from(element.classList).some(cls => cls.includes('transcript'))) {
//             // Get the inner text and compress multiple newlines
//             let transcript = element.innerText;

//             // Replace multiple newlines with a single newline
//             transcript = transcript.replace(/\n\s*\n/g, '\n').trim();

//             return transcript; // Return cleaned-up transcript text

//           } else {
//             return null; // Return null if transcript not found
//           }
//         },
//       }, async (injectionResults) => {
//         // Fetch API key and GPT model from storage
//         chrome.storage.sync.get(['openAIKey', 'gptModel'], async (data) => {
//           const apiKey = data.openAIKey;
//           const model = data.gptModel || 'text-davinci-003'; // Default model

//           if (!apiKey) {
//             console.error('API key is not set. Please set the API key in the options page.');
//             return;
//           }

//           for (const frameResult of injectionResults) {
//             console.log("frameResult.result", frameResult.result)
//             // Check if we have valid transcript text
//             if (frameResult.result) {
//               try {
//                 const notes = await generateNotes(frameResult.result, apiKey, model, tabId);
//                 sendResponse({ transcript: frameResult.result, notes: notes });
//               } catch (error) {
//                 console.error('Error generating notes:', error);
//               }
//             } else {
//               sendResponse({ notes: "Transcript not found." }); // Inform popup that the transcript was not available
//             }
//           }
//         });
//       });
//     });
//     return true; // Indicates asynchronous response
//   }
// });

// ------------------
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "generateNotes") {
//         const tabId = sender.tab ? sender.tab.id : tabs[0].id; // Capture the current tab ID
//         const gptModel = message.gptModel; // Use the model from the message payload

//         chrome.scripting.executeScript({
//             target: { tabId: tabId },
//             function: () => {
//                 // Extract transcript from the page
//                 const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
//                 let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

//                 if (element && Array.from(element.classList).some(cls => cls.includes('transcript'))) {
//                     let transcript = element.innerText;
//                     transcript = transcript.replace(/\n\s*\n/g, '\n').trim();
//                     return transcript;
//                 } else {
//                     return null;
//                 }
//             },
//         }, async (injectionResults) => {
//             chrome.storage.sync.get(['openAIKey'], async (data) => {
//                 const apiKey = data.openAIKey;

//                 if (!apiKey) {
//                     console.error('API key is not set. Please set the API key in the options page.');
//                     return;
//                 }

//                 for (const frameResult of injectionResults) {
//                     if (frameResult.result) {
//                         try {
//                             const notes = await generateNotes(frameResult.result, apiKey, gptModel, tabId);
//                             sendResponse({ transcript: frameResult.result, notes: notes });
//                         } catch (error) {
//                             console.error('Error generating notes:', error);
//                         }
//                     } else {
//                         sendResponse({ notes: "Transcript not found." });
//                     }
//                 }
//             });
//         });

//         return true; // Indicates asynchronous response
//     }
// });

// -------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "generateNotes") {
        // Use chrome.tabs.query to safely obtain the tabId
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = sender.tab ? sender.tab.id : (tabs.length > 0 ? tabs[0].id : null);

            if (!tabId) {
                console.error('No active tab found to execute script.');
                sendResponse({ notes: "Error: No active tab found." });
                return;
            }

            const courseUrl = message.url; // Assuming message.url holds the URL

            // Check if the transcript already exists in storage
            getTranscript(courseUrl).then(transcript => {
                if (transcript) {
                    console.log("Transcript found in storage, generating notes...");
                    generateNotesAndRespond(transcript, message.gptModel, tabId, sendResponse);
                } else {
                    console.log("Transcript not found in storage, extracting from page...");
                    extractTranscriptFromPage(tabId, (transcriptText) => {
                        if (transcriptText) {
                            // Save the extracted transcript
                            saveTranscript(courseUrl, transcriptText);
                            generateNotesAndRespond(transcriptText, message.gptModel, tabId, sendResponse);
                        } else {
                            sendResponse({ notes: "Transcript not found." });
                        }
                    });
                }
            }).catch(error => {
                console.error('Error checking transcript in storage:', error);
                sendResponse({ notes: "Error accessing transcript storage." });
            });
        });

        return true; // Indicates asynchronous response
    }
});

function extractTranscriptFromPage(tabId, callback) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
            let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (element && Array.from(element.classList).some(cls => cls.includes('transcript'))) {
                let transcript = element.innerText;
                transcript = transcript.replace(/\n\s*\n/g, '\n').trim();
                return transcript;
            } else {
                return null;
            }
        },
    }, (injectionResults) => {
        const transcript = injectionResults[0]?.result;
        callback(transcript);
    });
}

function generateNotesAndRespond(transcriptText, gptModel, tabId, sendResponse) {
    chrome.storage.sync.get(['openAIKey'], async (data) => {
        const apiKey = data.openAIKey;

        if (!apiKey) {
            console.error('API key is not set. Please set the API key in the options page.');
            sendResponse({ notes: "API key not set." });
            return;
        }

        try {
            const notes = await generateNotes(transcriptText, apiKey, gptModel, tabId);
            sendResponse({ transcript: transcriptText, notes: notes });
        } catch (error) {
            console.error('Error generating notes:', error);
            sendResponse({ notes: "Error generating notes." });
        }
    });
}

// Function to get the transcript for a given URL
function getTranscript(url) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['transcripts'], (data) => {
            const transcripts = data.transcripts || {};
            resolve(transcripts[url] || null);
        });
    });
}

// Function to save the transcript for a given URL
function saveTranscript(url, transcript) {
    chrome.storage.local.get(['transcripts'], (data) => {
        const transcripts = data.transcripts || {};
        transcripts[url] = transcript;
        chrome.storage.local.set({ transcripts }, () => {
            console.log(`Transcript saved for ${url}`);
        });
    });
}