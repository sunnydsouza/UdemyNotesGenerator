# Utilities

The `markdown-backend` includes several utility functions that support its core functionality. These utilities help with file operations and ensure that filenames and folder names are safe for use.

## Utility Functions

### saveMarkdownFile

This function is responsible for creating the folder structure and saving a markdown file.

#### Parameters
- `baseFolder`: The root folder where the course markdown is stored.
- `courseTitle`: The course title.
- `sectionTitle`: The section title.
- `fileName`: The markdown file name.
- `content`: The content to write in the markdown file.

#### Returns
- The full path to the saved file.

### sanitize

This function sanitizes a string to make it a safe filename or folder name.

#### Parameters
- `name`: The name to sanitize.

#### Returns
- The sanitized name, with invalid characters removed and spaces replaced with underscores.

### Example Usage

```javascript
const { saveMarkdownFile, sanitize } = require('../utils/fileUtils');

const safeName = sanitize("Invalid/File:Name?");
console.log(safeName); // Output: "Invalid_File_Name_"

const filePath = await saveMarkdownFile("/path/to/base", "Course Title", "Section Title", "notes.md", "# Sample Content");
console.log(filePath); // Output: "/path/to/base/Course_Title/Section_Title/notes.md"
