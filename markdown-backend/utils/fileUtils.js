const fs = require('fs').promises;
const path = require('path');

/**
 * Creates the folder structure and saves the markdown file.
 * @param {string} baseFolder - The root folder where the course markdown is stored.
 * @param {string} courseTitle - The course title.
 * @param {string} sectionTitle - The section title.
 * @param {string} fileName - The markdown file name.
 * @param {string} content - The content to write in the markdown file.
 * @returns {string} - The full path to the saved file.
 */
async function saveMarkdownFile(baseFolder, courseTitle, sectionTitle, fileName, content) {
    // Create folder structure
    const courseFolder = path.join(baseFolder, sanitize(courseTitle));
    const sectionFolder = path.join(courseFolder, sanitize(sectionTitle));
    const filePath = path.join(sectionFolder, sanitize(fileName));

    // Ensure folders exist
    await fs.mkdir(sectionFolder, { recursive: true });

    // Write content to file
    await fs.writeFile(filePath, content, 'utf8');

    return filePath;
}

/**
 * Sanitizes a string to make it a safe filename or folder name.
 * @param {string} name - The name to sanitize.
 * @returns {string} - The sanitized name.
 */
function sanitize(name) {
    return name.replace(/[<>:"\/\\|?*]+/g, '').replace(/\s+/g, '_');
}

module.exports = { saveMarkdownFile };
