document.addEventListener('DOMContentLoaded', async () => {
    resetPopup();
    await initializePopup();
    // Event listener for when notes are ready
    window.addEventListener('notesReady', handleNotesReady);

});

const generateNotesTimeout = 180000 //120secs
let currentIndex = 0;
let lectureTitle = 'Unable to resolve lecture title'
let sectionTitle = 'Unable to resolve section title'
let notesArray = ['No notes generated yet']

let initialized = false;

async function initializePopup() {
    if (initialized) return; // Prevent duplicate initialization
    initialized = true;

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const url = new URL(tabs[0].url);
        const isUdemy = url.hostname.endsWith("udemy.com") && /\/course\/[^\/]+\/learn\/lecture\/\d+(#overview)?$/.test(url.pathname);

        if (!isUdemy) {
            disableAllButtons("This extension is only enabled for Udemy lecture pages.");
            return;
        }

        const courseUrl = await getCourseUrl(url.href);
        prefillFolderLocation(courseUrl)

        await isReadyToGenerateNotes(tabs[0].id);

        // await getLectureDetails(tabs[0].id);

        chrome.storage.sync.get('openAIKey', function (data) {
            if (!data.openAIKey) {
                disableAllButtons('Please set your OpenAI API Key in the extension options.');
            } else {
                // loadNotesForUrl(tabs[0].url);
                displayLectureDetails();
                displayNotes(notesArray[notesArray.length - 1], notesArray.length - 1, notesArray.length);

            }
        });
    });
}


function handleNotesReady(event) {
    if (event.detail.status === 'ready') {
        // Update your UI components, e.g., re-enable buttons, hide loading, etc.
        refreshGenerateButtonStatus(true); // Example of enabling the generate button
        document.getElementById('loading').style.display = 'none'; // Hide loading
        document.getElementById('notes').style.pointerEvents = 'auto'; // Re-enable note interaction
        document.getElementById('notes').style.opacity = '1'; // Restore opacity
    }
}

function disableAllButtons(message) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = true);
    document.getElementById('notes').innerText = message;
}

let contentCheckTimeout;


async function isReadyToGenerateNotes(tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'isReadyToGenerateNotes' }, (response) => {
        if (response && typeof response.isReady !== 'undefined') {
            console.log('isReadyToGenerateNotes: true')
            refreshGenerateButtonStatus(response.isReady);
        } else {
            console.log('isReadyToGenerateNotes: false')
            refreshGenerateButtonStatus(false);
        }
    });

    //     // Fetch lecture details after checking readiness
    chrome.tabs.sendMessage(tabId, { action: 'getLectureDetails' }, (response) => {
        if (response) {
            console.log(`Lecture Title: ${response.lectureTitle}`);
            console.log(`File to Save: ${response.fileToSave}`);
            console.log(`Folder Location: ${response.folderLocation}`);

            lectureTitle = response.lectureTitle;
            sectionTitle = response.sectionTitle;
            notesArray = response.notesArray.length > 0 ? response.notesArray : ['No notes generated yet']

            // Display notes if they are available
            if (notesArray && notesArray.length > 0) {
                // notesArray = response.notesArray;
                console.log(notesArray);
                displayLectureDetails();
                displayNotes(notesArray[notesArray.length - 1], notesArray.length - 1, notesArray.length);
            } else {
                console.log('No notes available for display.');
            }

        }
    });

}

async function getLectureDetails(tabId) {
    return new Promise((resolve, reject) => {
        // Fetch lecture details after checking readiness
        chrome.tabs.sendMessage(tabId, { action: 'getLectureDetails' }, (response) => {
            if (response) {
                console.log(`Lecture Title: ${response.lectureTitle}`);
                console.log(`File to Save: ${response.fileToSave}`);
                console.log(`Folder Location: ${response.folderLocation}`);

                lectureTitle = response.lectureTitle;
                sectionTitle = response.sectionTitle;
                notesArray = response.notesArray.length > 0 ? response.notesArray : ['No notes generated yet']

                // Display notes if they are available
                if (notesArray && notesArray.length > 0) {
                    // notesArray = response.notesArray;
                    console.log(notesArray);
                    displayLectureDetails();
                    displayNotes(notesArray[notesArray.length - 1], notesArray.length - 1, notesArray.length);
                } else {
                    console.log('No notes available for display.');
                }

                resolve({ lectureTitle, sectionTitle, notesArray });
            } else {
                reject("Failed to get lecture details");
            }
        });
    });
}

function prefillFolderLocation(courseUrl) {
    if (!courseUrl) return;

    chrome.storage.sync.get(courseUrl, (result) => {
        const folderLocation = result[courseUrl];
        if (folderLocation) {
            document.getElementById('folderLocation').value = folderLocation;
        }
    });
}

function toggleLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'inline-block' : 'none';
    }
    const notesElement = document.getElementById('notes');
    if (notesElement) {
        notesElement.style.pointerEvents = show ? 'none' : 'auto';
        notesElement.style.opacity = show ? '0.5' : '1';
    }
}

function toggleButtons(show) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = !show);
}

function generateNotesForCurrentLecture(url, timeoutDuration = 60000) {
    return new Promise((resolve, reject) => {
        // const currentUrl = getCourseUrlFromTab(); // Or however you retrieve the current URL
        const timeoutId = setTimeout(() => {
            toggleLoading(false);
            toggleButtons(true);
            console.log('Note generation timed out. Please try again.');
            reject('Note generation timed out'); // Reject the promise on timeout
        }, timeoutDuration); // Use the provided timeout duration

        chrome.runtime.sendMessage({ action: "generateNotes", url: url }, (response) => {
            clearTimeout(timeoutId); // Clear the timeout if notes generation completes

            if (response && response.notes) {
                console.log("Notes generated successfully.");
                updateNotesDisplay(response.notes, url);
                // logMessage("Successfully generated notes.");
                resolve(); // Resolve the promise when notes are generated
            } else {
                console.error('No notes generated or there was an error.');
                alert('No notes generated or there was an error.'); // Optional error handling
                reject('No notes generated'); // Reject on error
            }
        });
    });
}

document.getElementById('generate').addEventListener('click', async () => {
    const tabUrl = (await chrome.tabs.query({ active: true, currentWindow: true }))[0].url;

    toggleLoading(true);
    toggleButtons(false);

    try {
        await generateNotesForCurrentLecture(tabUrl); // Call the refactored function with the default timeout
    } catch (error) {
        console.error(error); // Handle any error or timeout here
    } finally {
        toggleLoading(false);
        toggleButtons(true); // Re-enable buttons after operation complete
    }
});

document.getElementById('copy').addEventListener('click', () => {
    const notes = document.getElementById('notes').innerText;
    navigator.clipboard.writeText(notes).then(() => {
        alert('Notes copied to clipboard!');
    });
});

document.getElementById('prevNote').addEventListener('click', () => navigateNotes(-1));
document.getElementById('nextNote').addEventListener('click', () => navigateNotes(1));
document.getElementById('prevItem').addEventListener('click', () => handleNavigation('previous'));
document.getElementById('nextItem').addEventListener('click', () => handleNavigation('next'));

function handleNavigation(direction) {
    navigateToItem(direction);
    resetPopup();
    // Check content readiness after a 3 second delay
    checkReadinessAfterReset();
}

function resetPopup() {
    lectureTitle = ''
    sectionTitle = ''
    document.getElementById('noteIndex').innerText = "0/0";
    document.getElementById('notes').innerText = "";
    document.getElementById('lectureName').innerText = lectureTitle;

    document.getElementById('successTick').style.display = 'none';
    document.getElementById('errorCross').style.display = 'none';

    refreshGenerateButtonStatus(false);
}

function checkReadinessAfterReset() {
    setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs.length > 0) {
                await isReadyToGenerateNotes(tabs[0].id);
                // await getLectureDetails(tabs[0].id)
            }
        });
    }, 4500); // 3 seconds delay
}

function navigateToItem(direction) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (direction) => {
                const xpath = direction === 'previous' ?
                    '//*[@id="go-to-previous-item"]' :
                    '//*[@id="go-to-next-item"]';
                const element = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                if (element) {
                    element.click();
                }
            },
            args: [direction]
        });
    });
}

function updateNotesDisplay(notes, url) {
    chrome.storage.local.get([url], (result) => {
        let notesArray = result[url] ? result[url] : [];
        notesArray.push(notes);
        chrome.storage.local.set({ [url]: notesArray }, () => {
            displayNotes(notes, notesArray.length - 1, notesArray.length);
        });
    });
}

function displayLectureDetails() {
    document.getElementById('lectureName').innerText = `${sectionTitle} - ${lectureTitle}`;
}

function displayNotes(notes, index, total) {
    document.getElementById('notes').innerText = notes;
    document.getElementById('noteIndex').innerText = `${index + 1}/${total}`;

    // Toggle visibility of note navigation based on number of notes
    const noteNavigation = document.getElementById('noteNavigation');
    noteNavigation.style.display = total > 1 ? 'flex' : 'none';

    // document.getElementById('lectureName').innerText = extractTitleFromNotes(notes);
}


function navigateNotes(direction) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        chrome.storage.local.get([currentUrl], function (result) {
            if (result[currentUrl]) {
                let notesArray = result[currentUrl];
                let newIndex = currentIndex + direction;

                // Ensure valid index
                if (newIndex >= 0 && newIndex < notesArray.length) {
                    displayNotes(notesArray[newIndex], newIndex, notesArray.length);
                    currentIndex = newIndex;
                }
            }
        });
    });
}

function refreshGenerateButtonStatus(isReady) {
    console.log(`Value of isReady: ${isReady}`)
    const generateButton = document.getElementById('generate');
    if (generateButton) {
        generateButton.disabled = !isReady;
        generateButton.title = isReady ? "Click to generate notes." : "Transcript and course content must be visible to generate notes.";
    }
}

// Function to save current notes to markdown
function saveCurrentNotes() {
    return new Promise(async (resolve, reject) => {
        const markdownContent = document.getElementById('notes').innerText.trim();

        document.getElementById('successTick').style.display = 'none';
        document.getElementById('errorCross').style.display = 'none';

        if (!markdownContent) {
            document.getElementById('errorCross').innerText = "No markdown content available to save.";
            document.getElementById('errorCross').style.display = 'inline-block'; // Show error indicator
            reject('No markdown content available'); // Reject if no content
            return;
        }

        const courseUrl = await getCourseUrlFromTab();
        getFolderLocation(courseUrl, async (folderLocation) => {
            if (!folderLocation) {
                document.getElementById('errorCross').innerText = "User did not provide a folder location.";
                document.getElementById('errorCross').style.display = 'inline-block'; // Show error indicator
                return; // User did not provide a folder location
            }

            try {
                // const courseStructure = await loadCourseStructure(courseUrl, folderLocation); // Load the course structure
                await saveLectureMarkdown(folderLocation, markdownContent);
                document.getElementById('successTick').style.display = 'inline'; // Show success indicator
            } catch (error) {
                document.getElementById('errorCross').innerText = "Error saving lecture markdown.";
                document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
            }
        });
        resolve(); // Resolve the promise when save is successful
    });
}

// Refactored save to .md listener
document.getElementById('saveToMd').addEventListener('click', async () => {
    try {
        await saveCurrentNotes();
    } catch (error) {
        console.error(error);
    }
});

function sanitize(name) {
    return name.replace(/[<>:"\/\\|?*]+/g, '').replace(/\s+/g, '_');
}

function getFolderLocation(courseUrl, callback) {
    chrome.storage.sync.get([courseUrl], (result) => {
        let folderLocation = result[courseUrl];

        if (!folderLocation) {
            // Prompt the user to input the folder location
            folderLocation = document.getElementById('folderLocation').value.trim();
            if (!folderLocation) {
                alert("Please specify a folder location.");
                return;
            }

            // Save the folder location in storage for the course
            saveFolderLocation(courseUrl, folderLocation);
        } else {
            // Pre-fill the input field with the saved folder location
            document.getElementById('folderLocation').value = folderLocation;
        }

        callback(folderLocation);
    });
}

function saveFolderLocation(courseUrl, folderLocation) {
    const data = { [courseUrl]: folderLocation };
    chrome.storage.sync.set(data, () => {
        console.log(`Folder location saved for course: ${courseUrl}`);
        alert("Folder location saved successfully!");
    });
}


async function createFile(path, content) {
    await fetch('http://localhost:3000/api/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
    });
}

// Additional features: Show/Clear Course Data and Automate Notes
async function saveLectureMarkdown(baseFolder, markdownContent) {
    // Extract lecture title from the first line
    // const firstLine = markdownContent.split('\n')[0];
    // const lectureTitle = firstLine.startsWith('##') ? firstLine.replace('##', '').trim() : null;

    if (!lectureTitle) {
        console.error("Invalid markdown content. Lecture title not found.");
        alert("Lecture title not found in markdown content.");
        return; // Exit if no title
    }

    const sanitizedLectureTitle = sanitize(lectureTitle) + '.md';

    // Generate the section and lecture paths dynamically
    const courseUrl = await getCourseUrlFromTab();
    const folderLocation = document.getElementById('folderLocation').value.trim();

    if (!folderLocation) {
        alert("Please specify a folder location.");
        return;
    }

    // Extract the section dynamically from the current lecture's parent
    // const sectionTitle = await getSectionTitle(); // Add a helper to extract section title
    const sanitizedSectionTitle = sanitize(sectionTitle);
    const sectionPath = `${folderLocation}/${sanitizedSectionTitle}`;
    const lecturePath = `${sectionPath}/${sanitizedLectureTitle}`;

    // Check if the file exists
    if (!document.getElementById('autoGenerate').checked) {
        const fileExists = await checkFileExists(lecturePath);
        if (fileExists) {
            const overwrite = confirm(`File "${sanitizedLectureTitle}" already exists. Overwrite?`);
            if (!overwrite) {
                console.log("User chose not to overwrite the file.");
                return; // Exit if the user chooses not to overwrite
            }
        }
    }

    // Create the section folder if it doesn't exist
    await createFolder(sectionPath);

    // Save the file
    try {
        await createFile(lecturePath, markdownContent);
        console.log(`Lecture notes saved to ${lecturePath}`);
        // alert("Lecture notes saved successfully.");
    } catch (error) {
        console.error("Error saving lecture markdown:", error);
        alert("Failed to save lecture notes.");
    }
}

async function checkFileExists(path) {
    const response = await fetch('http://localhost:3000/api/check-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    });

    if (response.ok) {
        const result = await response.json();
        return result.exists; // Returns true if the file exists
    } else {
        throw new Error("Failed to check if file exists.");
    }
}

// Helper to create a folder
async function createFolder(path) {
    await fetch('http://localhost:3000/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    });
}

async function getSectionTitle() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    // Locate the current section container
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
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    resolve(results[0].result);
                } else {
                    reject("Failed to fetch section title.");
                }
            });
        });
    });
}

document.getElementById('showCourseData').addEventListener('click', () => {
    chrome.storage.local.get(null, (data) => {
        console.log("Stored Data:", data);
        alert(JSON.stringify(data, null, 2));
    });
});

document.getElementById('clearCourseData').addEventListener('click', async () => {
    const courseUrl = await getCourseUrlFromTab();
    if (courseUrl) {
        chrome.storage.local.get(null, (data) => {
            const keysToRemove = Object.keys(data).filter(key => key.startsWith(courseUrl));
            if (keysToRemove.length > 0) {
                chrome.storage.local.remove(keysToRemove, () => {
                    console.log(`Cleared course data for: ${courseUrl}`);
                    alert(`Course data cleared for: ${courseUrl}`);
                });
            } else {
                alert(`No data found for: ${courseUrl}`);
            }
        });
    } else {
        alert("No valid course URL found.");
    }
});

async function generateAndSaveNotesAutomatically() {
    const autoGenerateCheckbox = document.getElementById('autoGenerate');
    if (!autoGenerateCheckbox.checked) return;

    const waitBetweenLectures = 6000; // 6 seconds, configurable
    const waitAfterSave = 3000;      // 3 seconds, configurable

    function processLecture() {
        navigateToItem('next'); // Start by navigating to the next lecture
        resetPopup();
        logMessage("Clicked on Next");

        // Wait for the lecture to load
        return delay(waitBetweenLectures).then(() => {
            return chrome.tabs.query({ active: true, currentWindow: true });
        }).then((tabs) => {
            console.log('Tabs', tabs)
            if (tabs.length > 0) {
                const tabId = tabs[0].id;
                const tabUrl = tabs[0].url;

                return isReadyToGenerateNotes(tabId).then(() => {
                    // if (isGenerateButtonEnabled()) {
                    console.log(`Generate button is enabled`)
                    logMessage(`Trying to generate notes for lecture ${lectureTitle}`);
                    toggleLoading(true);
                    toggleButtons(false);
                    return generateNotesForCurrentLecture(tabUrl).then(async () => {
                        toggleLoading(false);
                        toggleButtons(true);
                        await delay(3000);
                        return saveCurrentNotes().then(() => {
                            logMessage(`Lecture notes saved successfully for ${lectureTitle}.`);
                            return delay(waitAfterSave); // Wait after saving
                        });
                    });
                    // } else {
                    //     logMessage("Generate button not enabled, skipping to next lecture");
                    // }
                });
            }
        }).then(() => {
            navigateToNextIfNeeded();
        });
    }

    processLecture();

    function navigateToNextIfNeeded() {
        if (autoGenerateCheckbox.checked) {
            setTimeout(processLecture, waitBetweenLectures); // Proceed to next lecture
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function logMessage(message) {
        const logDirectory = await getCourseLogDirectory();
        const logFilePath = logDirectory + `/_${getCurrentDate()}.md`;

        // Append log to the file via an API or within local storage
        appendToLogFile(logFilePath, message);
    }

    function getCurrentDate() {
        const date = new Date();
        return date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2);
    }

    async function getCourseLogDirectory() {
        const courseUrl = await getCourseUrlFromTab();
        return new Promise((resolve) => {
            chrome.storage.sync.get(courseUrl, (result) => {
                const folderLocation = result[courseUrl] || '';
                resolve(folderLocation);
            });
        });
    }

    async function appendToLogFile(filePath, content) {
        const timestamp = new Date().toISOString();
        const logEntry = `\n[${timestamp}] ${content}\n`;

        // Use an API call or other backend method to append to log
        await fetch('http://localhost:3000/api/append-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, content: logEntry }),
        });
    }

}

document.getElementById('autoGenerate').addEventListener('change', (event) => {
    if (event.target.checked) {
        generateAndSaveNotesAutomatically();
    }
});

async function getCourseUrlFromTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                reject("No active tab found.");
            } else {
                const url = new URL(tabs[0].url);
                resolve(getCourseUrl(url.href));
            }
        });
    });
}

async function getCourseUrl(href) {
    const match = href.match(/https:\/\/www\.udemy\.com\/course\/[^\/]+\//);
    return match ? match[0] : null;
}