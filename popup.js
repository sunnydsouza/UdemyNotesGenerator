// popup.js
function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'inline' : 'none';
}

function toggleButtons(show) {
    document.getElementById('copy').style.display = show ? 'block' : 'none';
    document.getElementById('saveToMd').style.display = show ? 'block' : 'none';
}


document.getElementById('generate').addEventListener('click', () => {
    toggleLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        chrome.runtime.sendMessage({ action: "generateNotes", url: currentUrl }, (response) => {
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



// Navigation buttons event listeners
document.getElementById('prevNote').addEventListener('click', () => navigateNotes(-1));
document.getElementById('nextNote').addEventListener('click', () => navigateNotes(1));

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


// Listener for the button click
document.getElementById('generateMarkdown').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractCourseContent
        }, (results) => {
            const markdown = results[0].result;
            // document.getElementById('notesTextarea').value = markdown;
            document.getElementById('notes').innerText = markdown;
            toggleLoading(false);
            toggleButtons(true);
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

    if (!markdownContent) {
        alert("No markdown content available to save.");
        return;
    }

    const courseUrl = await getCourseUrlFromTab();
    // const folderLocation = await getFolderLocation(courseUrl);

    // if (!folderLocation) {
    //     alert("Please set a folder location for the course.");
    //     return;
    // }

    // const courseStructure = await loadCourseStructure(courseUrl, folderLocation); // Load the course structure from backend or storage
    // await saveLectureMarkdown(courseStructure, folderLocation, markdownContent);
    getFolderLocation(courseUrl, async (folderLocation) => {
        if (!folderLocation) {
            return; // User did not provide a folder location
        }

        const courseStructure = await loadCourseStructure(courseUrl, folderLocation); // Load the course structure
        await saveLectureMarkdown(courseStructure, folderLocation, markdownContent);
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
    if (!lectureTitle) {
        alert("Invalid markdown content. Lecture title not found.");
        return;
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
        alert("Section for this lecture not found.");
        return;
    }

    // Save the markdown file under the correct section folder
    const lecturePath = `${baseFolder}/${sectionFolder}/${sanitizedLectureTitle}`;
    await createFile(lecturePath, markdownContent);

    alert(`Lecture saved successfully under ${sectionFolder}!`);
}


