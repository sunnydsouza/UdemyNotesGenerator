// popup.js
function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'inline' : 'none';
}

function toggleButtons(show) {
    document.getElementById('copy').style.display = show ? 'block' : 'none';
    // document.getElementById('regenerate').style.display = show ? 'block' : 'none';
}

document.getElementById('generate').addEventListener('click', () => {
    toggleLoading(true);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        chrome.runtime.sendMessage({action: "generateNotes", url: currentUrl}, (response) => {
            updateNotesDisplay(response.notes, currentUrl);
            toggleLoading(false);
            toggleButtons(true);
        });
    });
});

document.getElementById('copy').addEventListener('click', () => {
    const notes = document.getElementById('notes').innerText;
    navigator.clipboard.writeText(notes).then(() => {
        alert('Notes copied to clipboard!');
    });
});

// document.getElementById('regenerate').addEventListener('click', () => {
//     document.getElementById('generate').click();
// });

// Navigation buttons event listeners
document.getElementById('prevNote').addEventListener('click', () => navigateNotes(-1));
document.getElementById('nextNote').addEventListener('click', () => navigateNotes(1));

let currentIndex = 0; // To track the current index of the note being displayed

// document.addEventListener('DOMContentLoaded', () => {
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         const currentUrl = tabs[0].url;
//         loadNotesForUrl(currentUrl);
//     });
// });
document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = new URL(tabs[0].url);
        console.log("url", url)
        console.log("url.hostname", url.hostname)
        console.log("url.pathname", url.pathname)
        console.log("test pattern", /\/course\/[^\/]+\/learn\/lecture\/\d+(#overview)?$/.test(url.pathname))
        const isUdemy = url.hostname.endsWith("udemy.com") && /\/course\/[^\/]+\/learn\/lecture\/\d+(#overview)?$/.test(url.pathname);
        const buttons = document.querySelectorAll('button');
        
        if (!isUdemy) {
            buttons.forEach(button => button.disabled = true);
            document.getElementById('notes').innerText = 'This extension is only enabled for Udemy lecture pages.';
            return;
        }

        // Perform the API key check and other initializations only if the domain is a match
        chrome.storage.sync.get('openAIKey', function(data) {
            if (!data.openAIKey) {
                document.getElementById('notes').innerText = 'Please set your OpenAI API Key in the extension options.';
                document.getElementById('notes').style.color = 'red';
                buttons.forEach(button => button.disabled = true);
            } else {
                // Enable features if the API key is present
                loadNotesForUrl(tabs[0].url);
            }
        });
    });
});



function updateNotesDisplay(notes, url) {
    // Function to update the display and storage with new notes
    chrome.storage.local.get([url], function(result) {
        let notesArray = result[url] ? result[url] : [];
        notesArray.push(notes); // Add new notes to the array
        chrome.storage.local.set({[url]: notesArray}, function() {
            displayNotes(notes, notesArray.length - 1, notesArray.length);
        });
    });
}

function loadNotesForUrl(url) {
    // Function to load notes for a URL and display the most recent one
    chrome.storage.local.get([url], function(result) {
        if (result[url] && result[url].length > 0) {
            let notesArray = result[url];
            displayNotes(notesArray[notesArray.length - 1], notesArray.length - 1, notesArray.length);
            toggleButtons(true);
        }
    });
}

function displayNotes(notes, index, total) {
    // Update notes display and navigation UI
    document.getElementById('notes').innerText = notes;
    document.getElementById('noteIndex').innerText = `${index + 1}/${total}`;
    currentIndex = index;
    toggleNavigation(total > 1); // Show navigation if there are multiple notes
}

function toggleNavigation(show) {
    document.getElementById('navigation').style.display = show ? 'block' : 'none';
}

function navigateNotes(direction) {
    // Function to navigate through notes
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        chrome.storage.local.get([currentUrl], function(result) {
            if (result[currentUrl]) {
                let notesArray = result[currentUrl];
                let newIndex = currentIndex + direction;
                if (newIndex >= 0 && newIndex < notesArray.length) {
                    displayNotes(notesArray[newIndex], newIndex, notesArray.length);
                }
            }
        });
    });
}


// Listener for the button click
document.getElementById('generateMarkdown').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: extractCourseContent
      }, (results) => {
        const markdown = results[0].result;
        // document.getElementById('notesTextarea').value = markdown;
        document.getElementById('notes').innerText = markdown;
      });
    });
  });
  
  // This function runs in the context of the page and extracts the course structure
  function extractCourseContent() {
    console.log("extractCourseContent");

    // Find all sections within the curriculum
    const sections = document.querySelectorAll('div[data-purpose="curriculum-section-container"] > div');

    let markdown = '';

    sections.forEach((section, sectionIndex) => {
      // Find the button that controls the section (expand/collapse)
      const sectionButton = section.querySelector('button[aria-expanded]');
      
      // If the section is not expanded, click the button to expand it
      if (sectionButton && sectionButton.getAttribute('aria-expanded') === 'false') {
        sectionButton.click(); // Expand the section
      }

      // Get the section title and duration
      const sectionTitleElem = section.querySelector('button span.ud-accordion-panel-title span');
    //   const sectionDurationElem = section.querySelector('div[data-purpose="section-duration"]');
      
      if (!sectionTitleElem) return; // Skip if missing title or duration
      
      const sectionTitle = sectionTitleElem.innerText.trim();
    //   const sectionDuration = sectionDurationElem.innerText.trim();
      
      // Add section heading in markdown
      markdown += `## ${sectionTitle}\n\n`;

      // Get all the lecture items within the section
      const lectureItems = section.querySelectorAll('li div.curriculum-item-link--item-container--HFnn0');
  
      // Loop through all lectures and extract the title and duration
      lectureItems.forEach((item, lectureIndex) => {
        const lectureTitleElem = item.querySelector('div.curriculum-item-link--curriculum-item-title--VBsdR span');
        const lectureDurationElem = item.querySelector('div.curriculum-item-link--metadata--XK804 span');

        if (lectureTitleElem && lectureDurationElem) {
          const lectureTitle = lectureTitleElem.innerText.trim();
          const lectureDuration = lectureDurationElem.innerText.trim();
          markdown += `**Lecture ${lectureTitle} (${lectureDuration})**\n\n`;
        }
      });
  
      markdown += '\n'; // Add space between sections
    });

    return markdown;
}

  


  
