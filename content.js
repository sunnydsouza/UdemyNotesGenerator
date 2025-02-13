/*****************************************************
 * content.js
 *****************************************************/

// Listen for messages from popup.js or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTranscript") {
        // Return the transcript from the DOM if available
        const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element) {
            sendResponse({ transcript: element.innerText });
        } else {
            sendResponse({ transcript: 'Transcript not found.' });
        }
    }

    if (request.action === 'isReadyToGenerateNotes') {
        // Asynchronously check if the DOM is ready for notes
        checkReadiness((isReady) => {
            sendResponse({ isReady });
        }, request.courseUrl);
        return true; // Indicate async response
    }

    if (request.action === 'getLectureDetails') {
        // Gather lecture details, then send them back asynchronously
        const lectureTitle = getLectureTitle();
        const sectionTitle = getSectionTitle();
        const fileToSave = `${sanitize(lectureTitle)}.md`; // Construct filename

        getNotes().then((notesArray) => {
            sendResponse({ lectureTitle, sectionTitle, fileToSave, notesArray });
        }).catch(error => {
            console.error("Failed to fetch notes:", error);
            sendResponse({ lectureTitle, sectionTitle, fileToSave, notesArray: [] });
        });
        return true; // Indicate async response
    }

    return true;
});

/*****************************************************
 * 1. Utility: Wait-for-element helpers (CSS & XPath)
 *****************************************************/

/**
 * Repeatedly checks for the presence of a DOM element matching a CSS selector.
 * @param {string} selector - The CSS selector to look for.
 * @param {number} maxAttempts - Maximum times to check before giving up.
 * @param {number} interval - Delay (ms) between attempts.
 * @return {Promise<Element|null>} Resolves with the found element or null if not found.
 */
function waitForSelector(selector, maxAttempts = 10, interval = 1000) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (attempts >= maxAttempts) {
                resolve(null);
            } else {
                attempts++;
                setTimeout(check, interval);
            }
        };
        check();
    });
}

/**
 * Repeatedly checks for the presence of a DOM node matching an XPath expression.
 * @param {string} xpath - The XPath expression to look for.
 * @param {number} maxAttempts - Maximum times to check before giving up.
 * @param {number} interval - Delay (ms) between attempts.
 * @return {Promise<Node|null>} Resolves with the found node or null if not found.
 */
function waitForXPath(xpath, maxAttempts = 10, interval = 1000) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (node) {
                resolve(node);
            } else if (attempts >= maxAttempts) {
                resolve(null);
            } else {
                attempts++;
                setTimeout(check, interval);
            }
        };
        check();
    });
}

/**
 * Combination helper: waits for the XPath node, then checks if it has the expected text content.
 * @param {string} xpath
 * @param {string} expectedText - Substring to look for in textContent.
 * @param {number} maxAttempts
 * @param {number} interval
 * @return {Promise<boolean>}
 */
function waitForXPathAndCheckText(xpath, expectedText, maxAttempts = 10, interval = 1000) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (node && node.textContent.trim().includes(expectedText)) {
                resolve(true);
            } else if (attempts >= maxAttempts) {
                resolve(false);
            } else {
                attempts++;
                setTimeout(check, interval);
            }
        };
        check();
    });
}

/*****************************************************
 * 2. DOM Interaction: Toggling transcript & content
 *****************************************************/

async function toggleTranscript() {
    try {
        const transcriptToggle = await waitForSelector('[data-purpose="transcript-toggle"]', 6, 1000);
        if (!transcriptToggle) {
            console.log("Transcript toggle not found after max attempts");
            return;
        }
        if (transcriptToggle.getAttribute('aria-expanded') === 'false') {
            transcriptToggle.click();
            console.log("Transcript toggled open.");
        } else {
            console.log("Transcript was already open.");
        }
    } catch (error) {
        console.error("Error while toggling transcript:", error);
    }
}

async function clickCourseContent() {
    try {
        const buttonXPath = "//button[.//span[contains(text(),'Course content')]]";
        const courseContentButton = await waitForXPath(buttonXPath, 6, 1000);
        if (!courseContentButton) {
            console.log("Course content button not found after max attempts");
            return;
        }
        if (courseContentButton.getAttribute('aria-expanded') !== 'true') {
            courseContentButton.click();
            console.log("Course content toggled open.");
        } else {
            console.log("Course content was already open.");
        }
    } catch (error) {
        console.error("Error while clicking course content:", error);
    }
}

/*****************************************************
 * 3. Readiness check: Ensuring elements are present
 *****************************************************/

function checkReadiness(callback, courseUrl) {
    // First, check if transcript is already in storage
    getTranscript(courseUrl).then(storedTranscript => {
        if (storedTranscript) {
            console.log("Transcript found in storage, skipping readiness checks");
            callback(true);
            return;
        }

        // If no stored transcript, we must wait for the DOM to have:
        //   1) The transcript region containing "Transcript"
        //   2) The course content region containing "Course content"
        const transcriptXPath = "//*[@id='scroll-port--2']/div[1]";
        const courseContentXPath = "(//section[@aria-label='Tab Navigation']//div[@data-index='1'])[2]";

        const waitForTranscript = waitForXPathAndCheckText(transcriptXPath, "Transcript", 10, 1000);
        const waitForCourseContent = waitForXPathAndCheckText(courseContentXPath, "Course content", 10, 1000);

        Promise.all([waitForTranscript, waitForCourseContent])
            .then(([transcriptReady, courseContentReady]) => {
                if (transcriptReady && courseContentReady) {
                    callback(true);
                } else {
                    console.log("Readiness check failed after max attempts");
                    callback(false);
                }
            })
            .catch(error => {
                console.error("Error while checking readiness:", error);
                callback(false);
            });
    });
}

/*****************************************************
 * 4. Other helpers: getTranscript, getNotes, titles
 *****************************************************/

/**
 * Get the transcript for a given URL from chrome.storage
 * @param {string} url
 * @return {Promise<string|null>} resolves with transcript text or null
 */
function getTranscript(url) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['transcripts'], (data) => {
            const transcripts = data.transcripts || {};
            resolve(transcripts[url] || null);
        });
    });
}

/**
 * Return the lecture title from the DOM
 */
function getLectureTitle() {
    const currentItem = document.querySelector('li[class*="curriculum-item-link--is-current"] div[class*="curriculum-item-link--item-container-"]');

    if (currentItem) {
        const titleElem = currentItem.querySelector('div.curriculum-item-link--curriculum-item-title--VBsdR span');
        const durationElem = currentItem.querySelector('div.curriculum-item-link--metadata--XK804 span');
        if (titleElem && durationElem) {
            const lectureTitle = titleElem.innerText.trim();
            const lectureDuration = durationElem.innerText.trim();
            return `Lecture ${lectureTitle} (${lectureDuration})`;
        }
    }
    return 'Unknown Lecture Title';
}

/**
 * Return the section title from the DOM
 */
function getSectionTitle() {
    const currentSection = document.querySelector(
        'div[data-purpose="curriculum-section-container"] button[aria-expanded="true"]'
    );
    if (currentSection) {
        const sectionTitleElem = currentSection.querySelector('span.ud-accordion-panel-title span');
        return sectionTitleElem ? sectionTitleElem.innerText.trim() : 'Unknown Section';
    }
    return 'Unknown Section';
}

/**
 * Get the notes from local storage for the current URL
 * @return {Promise<Array>} resolves with an array of notes
 */
function getNotes() {
    const currentUrl = window.location.href;
    return new Promise((resolve) => {
        chrome.storage.local.get([currentUrl], (result) => {
            if (result[currentUrl] && Array.isArray(result[currentUrl]) && result[currentUrl].length > 0) {
                resolve(result[currentUrl]);
            } else {
                resolve([]);
            }
        });
    });
}

/**
 * Sanitize a string for use in filenames
 */
function sanitize(name) {
    return name.replace(/[<>:"\/\\|?*]+/g, '').replace(/\s+/g, '_');
}

/*****************************************************
 * 5. Initialization logic on page load/URL change
 *****************************************************/

async function init(source) {
    console.log(`Initializing interactions from source: ${source}`);
    // Toggle transcript, then click course content
    await toggleTranscript();
    await clickCourseContent();
    // Add any other logic that should run on each new lecture load, if desired.
}

// Track page URL changes in a single-page app (SPA) with MutationObserver
let lastHref = window.location.href;

const observer = new MutationObserver(() => {
    const currentHref = window.location.href;
    if (currentHref !== lastHref) {
        lastHref = currentHref;
        console.log(`URL changed, re-initializing from mutation observer`);
        init('mutation observer');
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Also run init on the first full load
window.addEventListener('load', () => {
    console.log(`Page load detected, initializing`);
    init('load');
});
