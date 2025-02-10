// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTranscript") {
        const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
        let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element) {
            sendResponse({ transcript: element.innerText });
        } else {
            sendResponse({ transcript: 'Transcript not found.' });
        }
    }

    // Check if content is ready
    if (request.action === 'isReadyToGenerateNotes') {
        checkReadiness((isReady) => {
            sendResponse({ isReady });
        });
        return true; // Indicate async operation
    }

    // Get lecture details including notes
    if (request.action === 'getLectureDetails') {
        const lectureTitle = getLectureTitle();
        console.log(`Lecture title: ${lectureTitle}`)
        const sectionTitle = getSectionTitle();
        console.log(`Section title: ${sectionTitle}`)
        const fileToSave = `${sanitize(lectureTitle)}.md`; // Construct filename

        // Fetch the notes asynchronously, then resolve with the details
        getNotes().then((notesArray) => {
            sendResponse({ lectureTitle, sectionTitle, fileToSave, notesArray }); // Return the entire notes array
        }).catch(error => {
            console.error("Failed to fetch notes:", error);
            sendResponse({ lectureTitle, sectionTitle, fileToSave, notesArray: [] }); // Return an empty array in case of an error
        });
        return true; // Indicate async operation
    }
    return true;
});

// Helper to toggle transcript visibility
function toggleTranscript() {
    let attempts = 0;
    const maxAttempts = 2; // Retry up to 6 seconds
    const interval = 1500; // Check every 1 second

    const intervalId = setInterval(() => {
        const transcriptToggle = document.querySelector('[data-purpose="transcript-toggle"]');
        if (transcriptToggle && transcriptToggle.getAttribute('aria-expanded') === 'false') {
            transcriptToggle.click();
            clearInterval(intervalId);
        }

        if (++attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.log("Transcript toggle not found after max attempts");
        }
    }, interval);
}

// Helper to ensure course content is visible
function clickCourseContent() {
    let attempts = 0;
    const maxAttempts = 2; // Retry up to 6 seconds
    const interval = 1500; // Check every 1 second

    const intervalId = setInterval(() => {
        const courseContentButton = document.evaluate(
            "//button[.//span[contains(text(),'Course content')]]",
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        if (courseContentButton && courseContentButton.getAttribute('aria-expanded') !== 'true') {
            courseContentButton.click();
            clearInterval(intervalId);
        }

        if (++attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.log("Course content button not found after max attempts");
        }
    }, interval);
}

// Function to check readiness (transcript + course content)
function checkReadiness(callback) {
    let attempts = 0;
    const maxAttempts = 10; // Retry for up to 10 seconds
    const interval = 1000;

    const intervalId = setInterval(() => {
        const transcriptXPath = "//section[@data-purpose='sidebar']/div[1]";
        const transcriptElement = document.evaluate(transcriptXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        const courseContentXPath = "//section[@aria-label='Tab Navigation']//div[@data-index='1']";
        const courseContentElement = document.evaluate(courseContentXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        const isTranscriptReady = transcriptElement && transcriptElement.textContent.trim().includes('Transcript');
        const isCourseContentReady = courseContentElement && courseContentElement.textContent.trim() === 'Course content';
        const isReady = isTranscriptReady && isCourseContentReady;

        if (isReady) {
            clearInterval(intervalId);
            callback(true);
        } else if (++attempts >= maxAttempts) {
            clearInterval(intervalId);
            console.log("Readiness check failed after max attempts");
            callback(false);
        }
    }, interval);
}

// Function to get the lecture title from the DOM
function getLectureTitle() {
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

// Function to get the section title from the DOM
function getSectionTitle() {
    const currentSection = document.querySelector(
        'div[data-purpose="curriculum-section-container"] button[aria-expanded="true"]'
    );

    if (currentSection) {
        const sectionTitle = currentSection.querySelector(
            'span.ud-accordion-panel-title span'
        );
        return sectionTitle ? sectionTitle.innerText.trim() : 'Unknown Section';
    }
    return 'Unknown Section';
}

// Function to get the notes from local storage
function getNotes() {
    const currentUrl = window.location.href; // Get the current URL for context
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([currentUrl], function (result) {
            if (result[currentUrl] && result[currentUrl].length > 0) {
                const notesArray = result[currentUrl];
                resolve(notesArray); // Return the entire notes array
            } else {
                resolve([]); // Return an empty array if no notes found
            }
        });
    });
}


// Sanitize lecture title
function sanitize(name) {
    return name.replace(/[<>:"\/\\|?*]+/g, '').replace(/\s+/g, '_');
}

// Handle URL changes (via MutationObserver)
let lastHref = window.location.href;

// Initialize page interactions
let initTimeout;

function init(source) {
    // if (initTimeout) clearTimeout(initTimeout);

    // initTimeout = setTimeout(() => {
    console.log(`Initializing interactions from source: ${source}`);
    toggleTranscript();
    clickCourseContent();
    // displayNotes();
    // checkReadiness((isReady) => console.log('Initial readiness:', isReady));
    // }, 1000);
}


const observer = new MutationObserver(() => {
    const currentHref = window.location.href;
    if (currentHref !== lastHref) {
        lastHref = currentHref;
        console.log(`Calling init from within the mutation observer`)
        init('mutation observer'); // Reinitialize interactions for the new URL
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initialize on page load
window.addEventListener('load', () => {
    console.log(`Calling init from within load`)
    init('load');
});
// window.addEventListener("locationchange", () => {
//     const currentHref = window.location.href;
//     if (currentHref !== lastHref) {
//         lastHref = currentHref;
//         console.log(`Calling init from location change`)
//         init();
//     }
// });

// // Handle pushState and popstate events
// (function (history) {
//     const pushState = history.pushState;
//     history.pushState = function (state) {
//         if (typeof history.onpushstate == "function") {
//             history.onpushstate({ state: state });
//         }
//         const result = pushState.apply(history, arguments);
//         window.dispatchEvent(new Event("pushstate"));
//         window.dispatchEvent(new Event("locationchange"));
//         return result;
//     };

//     window.addEventListener("popstate", () => {
//         window.dispatchEvent(new Event("locationchange"));
//     });
// })(window.history);




