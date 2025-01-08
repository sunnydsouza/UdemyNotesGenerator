# Markdown Backend

This is a Node.js backend service for saving markdown files for courses and lectures. It supports creating a folder structure based on the course and section titles, retrieving the structure, and dynamically creating folders or files.

---

## Features
- Save markdown files under appropriate folders.
- Automatically creates a structured folder hierarchy for courses and sections.
- Retrieve the course folder structure dynamically.
- Provides API endpoints for:
  - Saving markdown files.
  - Creating folders.
  - Creating files.
  - Fetching course folder structures.

---

## Project Structure

```
markdown-backend/
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── routes/                  # API route handlers
│   ├── saveMarkdown.js      # Route to handle saving markdown files
│   ├── createFolder.js      # Route to create folders
│   ├── createFile.js        # Route to create files
│   ├── getCourseStructure.js # Route to retrieve course structure
├── utils/                   # Utility functions
│   ├── fileUtils.js         # Helper functions for file operations
├── notes/                   # Directory where markdown files will be saved
```

---

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd markdown-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **The server will run on** `http://localhost:3000`.

---

## API Usage

### **1. Save Markdown File**
- **Endpoint**: `POST /api/save-markdown`
- **Description**: Saves a markdown file to the appropriate folder based on the course and section titles.
- **Payload**:
  ```json
  {
      "baseFolder": "/path/to/course/folder",
      "courseTitle": "Spring Boot Course",
      "sectionTitle": "Section 1: Introduction",
      "fileName": "Lecture_1.md",
      "content": "## Lecture 1\nThis is the content of the markdown file."
  }
  ```
- **Response**:
  ```json
  {
      "message": "File saved successfully!",
      "filePath": "/path/to/course/folder/Spring_Boot_Course/Section_1_Introduction/Lecture_1.md"
  }
  ```

---

### **2. Create Folder**
- **Endpoint**: `POST /api/create-folder`
- **Description**: Creates a folder for a course or section.
- **Payload**:
  ```json
  {
      "path": "/path/to/course/folder/Section_1_Introduction"
  }
  ```
- **Response**:
  ```json
  {
      "message": "Folder created successfully at /path/to/course/folder/Section_1_Introduction."
  }
  ```

---

### **3. Create File**
- **Endpoint**: `POST /api/create-file`
- **Description**: Creates a file for a specific lecture.
- **Payload**:
  ```json
  {
      "path": "/path/to/course/folder/Section_1_Introduction/Lecture_1.md",
      "content": "## Lecture 1\nThis is the content of the markdown file."
  }
  ```
- **Response**:
  ```json
  {
      "message": "File created successfully at /path/to/course/folder/Section_1_Introduction/Lecture_1.md."
  }
  ```

---

### **4. Get Course Structure**
- **Endpoint**: `POST /api/get-course-structure`
- **Description**: Retrieves the folder and file structure for a course.
- **Payload**:
  ```json
  {
      "baseFolder": "/path/to/course/folder"
  }
  ```
- **Response**:
  ```json
  {
      "Section_1_Introduction": [
          "Lecture_1.md",
          "Lecture_2.md"
      ],
      "Section_2_Core_Concepts": [
          "Lecture_1.md",
          "Lecture_2.md"
      ]
  }
  ```

---

## Folder Structure Example

When the APIs are used to save markdown files and create the course structure, the following folder hierarchy will be created:

```
/path/to/course/folder/
└── Spring_Boot_Course/
    ├── Section_1_Introduction/
    │   ├── Lecture_1.md
    │   └── Lecture_2.md
    └── Section_2_Core_Concepts/
        ├── Lecture_1.md
        └── Lecture_2.md
```

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd markdown-backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Backend**:
   ```bash
   npm start
   ```

4. **Test the API**:
   - Use Postman, curl, or any HTTP client to send requests to the endpoints.
   - For example, to save a markdown file, send a `POST` request to `http://localhost:3000/api/save-markdown` with the payload shown above.

---

### Example Workflow

1. **Generate Course Structure**:
   - Call `POST /api/create-folder` to create course and section folders.
   - Call `POST /api/create-file` to add lecture files to the respective folders.

2. **Save Markdown Files**:
   - Use `POST /api/save-markdown` to save notes for lectures into the appropriate folders.

3. **Retrieve Course Structure**:
   - Use `POST /api/get-course-structure` to view the entire folder and file hierarchy for a course.

---

## Troubleshooting

1. **Server Not Running**:
   - Ensure Node.js is installed on your system.
   - Verify that no other application is using port 3000.

2. **API Not Responding**:
   - Check the server logs for errors.
   - Ensure the base folder path provided in the payload exists and is accessible.

