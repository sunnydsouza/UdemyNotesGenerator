// popup.js
// Function to handle incoming messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'displayNotes') {
        const notesElement = document.getElementById('notes');
        if (notesElement) {
            notesElement.innerText = request.notes;
        }
    }
    sendResponse({});
});

function toggleLoading(show) {
    const loadingElement = document.getElementById('loading');
    const notesElement = document.getElementById('notes');
    
    loadingElement.style.display = show ? 'block' : 'none';
    
    // Disable and grey out the notes area
    notesElement.style.pointerEvents = show ? 'none' : 'auto';
    notesElement.style.opacity = show ? '0.5' : '1';
}

// The rest of your JavaScript remains unchanged...

function toggleButtons(show) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = !show);
}

// Update the event listener for the generate button
document.getElementById('generate').addEventListener('click', () => {
    toggleLoading(true);
    toggleButtons(false); // Disable all buttons

    // Set a timeout for the max loading time
    const timeoutId = setTimeout(() => {
        toggleLoading(false);
        toggleButtons(true);
        alert('Note generation timed out. Please try again.');
    }, 30000); // Max wait time of 30 seconds

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        chrome.runtime.sendMessage({ action: "generateNotes", url: currentUrl }, (response) => {
            clearTimeout(timeoutId); // Clear the timeout on success
            toggleLoading(false); // Hide loading spinner

            // Ensure response is valid before updating display
            if (response && response.notes) {
                updateNotesDisplay(response.notes, currentUrl);
            } else {
                alert('No notes generated or there was an error.');
            }

            toggleButtons(true); // Re-enable buttons after processing
        });
    });
});



document.getElementById('copy').addEventListener('click', () => {
    const notes = document.getElementById('notes').innerText;
    navigator.clipboard.writeText(notes).then(() => {
        alert('Notes copied to clipboard!');
    });
});



// Navigation buttons event listeners
document.getElementById('prevNote').addEventListener('click', () => navigateNotes(-1));
document.getElementById('nextNote').addEventListener('click', () => navigateNotes(1));
document.getElementById('prevItem').addEventListener('click', () => navigateToItem('previous'));
document.getElementById('nextItem').addEventListener('click', () => navigateToItem('next'));

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


let currentIndex = 0; // To track the current index of the note being displayed


document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const url = new URL(tabs[0].url);
        console.log("url", url);
        console.log("url.hostname", url.hostname);
        console.log("url.pathname", url.pathname);
        console.log("test pattern", /\/course\/[^\/]+\/learn\/lecture\/\d+(#overview)?$/.test(url.pathname));

        // Check if it's a Udemy lecture page
        const isUdemy = url.hostname.endsWith("udemy.com") && /\/course\/[^\/]+\/learn\/lecture\/\d+(#overview)?$/.test(url.pathname);
        const buttons = document.querySelectorAll('button');

        if (!isUdemy) {
            buttons.forEach(button => button.disabled = true);
            document.getElementById('notes').innerText = 'This extension is only enabled for Udemy lecture pages.';
            return;
        }

        // Extract course URL
        const courseUrl = getCourseUrl(url.href);

        // Prefill folder location for the course if it exists
        prefillFolderLocation(courseUrl);

        // Perform API key check
        chrome.storage.sync.get('openAIKey', function (data) {
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



// Function to prefill the folder location input field
function prefillFolderLocation(courseUrl) {
    if (!courseUrl) return;

    chrome.storage.sync.get([courseUrl], (result) => {
        const folderLocation = result[courseUrl];
        if (folderLocation) {
            document.getElementById('folderLocation').value = folderLocation; // Prefill the input field
            console.log(`Prefilled folder location: ${folderLocation}`);
        } else {
            console.log('No folder location saved for this course.');
        }
    });
}




function updateNotesDisplay(notes, url) {
    // Function to update the display and storage with new notes
    chrome.storage.local.get([url], function (result) {
        let notesArray = result[url] ? result[url] : [];
        notesArray.push(notes); // Add new notes to the array
        chrome.storage.local.set({ [url]: notesArray }, function () {
            displayNotes(notes, notesArray.length - 1, notesArray.length);
        });
    });
}

function loadNotesForUrl(url) {
    // Function to load notes for a URL and display the most recent one
    chrome.storage.local.get([url], function (result) {
        if (result[url] && result[url].length > 0) {
            let notesArray = result[url];
            displayNotes(notesArray[notesArray.length - 1], notesArray.length - 1, notesArray.length);
            toggleButtons(true);
        }
    });
}

// Ensure `toggleNavigation` is called correctly
function displayNotes(notes, index, total) {
    document.getElementById('notes').innerText = notes;
    document.getElementById('noteIndex').innerText = `${index + 1}/${total}`;
    currentIndex = index;
    toggleNavigation(total > 1);
}

function toggleNavigation(show) {
    const navigation = document.getElementById('navigation');
    if (navigation) {
        navigation.style.display = show ? 'inline' : 'none';
    }
}

function navigateNotes(direction) {
    // Function to navigate through notes
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        chrome.storage.local.get([currentUrl], function (result) {
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


function getCourseUrl(url) {
    const match = url.match(/https:\/\/www\.udemy\.com\/course\/[^\/]+\//);
    return match ? match[0] : null;
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


document.getElementById('saveToMd').addEventListener('click', async () => {
    const markdownContent = document.getElementById('notes').innerText.trim();

    // Reset status indicators
    document.getElementById('successTick').style.display = 'none';
    document.getElementById('errorCross').style.display = 'none';

    if (!markdownContent) {
        document.getElementById('errorCross').innerText = "No markdown content available to save.";
        document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
        return;
    }

    const courseUrl = await getCourseUrlFromTab();
    getFolderLocation(courseUrl, async (folderLocation) => {
        if (!folderLocation) {
            document.getElementById('errorCross').innerText = "User did not provide a folder location.";
            document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
            return; // User did not provide a folder location
        }

        try {
            const courseStructure = await loadCourseStructure(courseUrl, folderLocation); // Load the course structure
            await saveLectureMarkdown(courseStructure, folderLocation, markdownContent);
            document.getElementById('successTick').style.display = 'inline'; // Show success indicator
        } catch (error) {
            document.getElementById('errorCross').innerText = "Error saving lecture markdown.";
            document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
        }
    });
});

async function getCourseUrlFromTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                reject("No active tab found.");
                return;
            }

            const url = new URL(tabs[0].url);
            const courseUrl = getCourseUrl(url.href);

            if (courseUrl) {
                resolve(courseUrl);
            } else {
                reject("Could not extract course URL from the current tab.");
            }
        });
    });
}


async function loadCourseStructure(courseUrl, baseFolder) {
    try {
        // Check if the course structure exists
        const response = await fetch('http://localhost:3000/api/get-course-structure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseUrl, baseFolder }),
        });

        if (response.ok) {
            const courseStructure = await response.json();
            if (Object.keys(courseStructure).length > 0) {
                console.log("Course structure loaded:", courseStructure);
                return courseStructure; // Return existing structure
            }
        }

        // If no structure exists, generate it
        console.log("Course structure not found. Generating...");
        const courseMarkdown = await extractCourseContentFromPage();
        const newStructure = await generateCourseStructure(courseMarkdown, baseFolder);
        console.log("Course structure generated:", newStructure);

        return newStructure;
    } catch (err) {
        console.error("Error loading course structure:", err);
        throw new Error("Failed to load or generate course structure.");
    }
}


async function extractCourseContentFromPage() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: extractCourseContent,
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    resolve(results[0].result);
                } else {
                    reject("Failed to extract course content.");
                }
            });
        });
    });
}


// Helper function to sanitize file names
function sanitize(name) {
    return name.replace(/[<>:"\/\\|?*]+/g, '').replace(/\s+/g, '_');
}

async function generateCourseStructure(courseMarkdown, baseFolder) {
    const lines = courseMarkdown.split('\n');
    let currentSection = null;
    const courseStructure = {};

    for (const line of lines) {
        if (line.startsWith('##')) {
            // Section (folder)
            const sectionName = line.replace('##', '').trim();
            const sanitizedSectionName = sanitize(sectionName);

            // Create folder for the section
            const sectionPath = `${baseFolder}/${sanitizedSectionName}`;
            await createFolder(sectionPath);

            // Track the current section
            currentSection = sanitizedSectionName;
            courseStructure[currentSection] = [];
        } else if (line.startsWith('**') && line.endsWith('**')) {
            // Lecture (file)
            if (!currentSection) continue; // Skip if no section is active

            const lectureName = line.replace(/\*\*/g, '').trim(); // Remove ** from both ends
            const sanitizedLectureName = sanitize(lectureName) + '.md';

            // Add lecture file to the course structure
            courseStructure[currentSection].push(sanitizedLectureName);

            // Create the file
            const lecturePath = `${baseFolder}/${currentSection}/${sanitizedLectureName}`;
            await createFile(lecturePath, `# ${lectureName}\n\nLecture content goes here.`);
        }
    }

    return courseStructure;
}

// Helper to create a folder
async function createFolder(path) {
    await fetch('http://localhost:3000/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    });
}

// Helper to create a file
async function createFile(path, content) {
    await fetch('http://localhost:3000/api/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
    });
}



async function saveLectureMarkdown(courseStructure, baseFolder, markdownContent) {
    // Extract lecture title from the first line
    const firstLine = markdownContent.split('\n')[0];
    const lectureTitle = firstLine.startsWith('##') ? firstLine.replace('##', '').trim() : null;

    // Reset status indicators
    document.getElementById('successTick').style.display = 'none';
    document.getElementById('errorCross').style.display = 'none';

    if (!lectureTitle) {
        document.getElementById('errorCross').innerText = "Invalid markdown content. Lecture title not found.";
        document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
        return; // Exit if no title
    }

    // Find the section folder containing this lecture
    const sanitizedLectureTitle = sanitize(lectureTitle) + '.md';
    let sectionFolder = null;

    for (const [section, lectures] of Object.entries(courseStructure)) {
        if (lectures.includes(sanitizedLectureTitle)) {
            sectionFolder = section;
            break;
        }
    }

    if (!sectionFolder) {
        document.getElementById('errorCross').innerText = "Section for this lecture not found.";
        document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
        return; // Exit if section not found
    }

    // Save the markdown file under the correct section folder
    const lecturePath = `${baseFolder}/${sectionFolder}/${sanitizedLectureTitle}`;
    
    try {
        await createFile(lecturePath, markdownContent);
        document.getElementById('successTick').style.display = 'inline'; // Show success indicator
    } catch (error) {
        document.getElementById('errorCross').innerText = "Error saving lecture markdown.";
        document.getElementById('errorCross').style.display = 'inline'; // Show error indicator
    }
}

document.getElementById('autoGenerate').addEventListener('change', (event) => {
    if (event.target.checked) {
        generateAndSaveNotesAutomatically();
    }
});



function generateAndSaveNotesAutomatically() {
    // Simulate a click on the Generate button
    document.getElementById('generate').click();

    // Set a timeout for when to check for notes being generated
    setTimeout(() => {
        const loadingElement = document.getElementById('loading');
        
        // Check that loading is not visible
        if (loadingElement.style.display === 'none') {
            const notesGenerated = document.getElementById('notes').innerText.trim();

            if (notesGenerated) {
                // If notes are generated, simulate the save process
                document.getElementById('saveToMd').click(); // Click to save as .md

                // After saving, navigate to the next item
                setTimeout(() => {
                    navigateToItem('next');

                    // Check if auto-generate is still enabled, if yes, call again
                    if (document.getElementById('autoGenerate').checked) {
                        setTimeout(generateAndSaveNotesAutomatically, 3000); // Delay before repeating
                    }
                }, 2000); // Allow some time for saving process, adjust as needed
            } else {
                // If notes are not generated yet, check again after some time
                setTimeout(generateAndSaveNotesAutomatically, 3000); // Re-check after 3 seconds
            }
        } else {
            // If loading is still visible, check again after a delay
            setTimeout(generateAndSaveNotesAutomatically, 3000); // Re-check after 3 seconds
        }
    }, 3000); // Initial check after generating notes
}

// Add event listener for Show Course Data button
document.getElementById('showCourseData').addEventListener('click', () => {
    chrome.storage.local.get(null, (data) => {
        console.log("Stored Data:", data);
        // Optionally, you could show this data in a more user-friendly way in your UI:
        // const notesElement = document.getElementById('notes');
        // if (notesElement) {
        //     notesElement.innerText = JSON.stringify(data, null, 2); // Show structured data
        // }
    });
});

// Existing event listener for Clear Course Data button
document.getElementById('clearCourseData').addEventListener('click', async () => {
    const courseUrl = await getCourseUrlFromTab(); // Fetch the course URL

    if (courseUrl) {
        // Retrieve all keys to find and remove data for this specific course URL
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


