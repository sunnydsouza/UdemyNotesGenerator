# Usage

The `markdown-backend` provides a set of API endpoints that can be used to manage markdown files and folders. Below are examples of how to use each endpoint.

## 1. Save Markdown

### Request

```bash
curl -X POST http://localhost:3000/api/save-markdown \
-H "Content-Type: application/json" \
-d '{
  "baseFolder": "/path/to/course",
  "courseTitle": "Course Title",
  "sectionTitle": "Section Title",
  "fileName": "notes.md",
  "content": "# Sample Markdown Content"
}'
```

### Response

```json
{
  "message": "File saved successfully!",
  "filePath": "/path/to/course/Course_Title/Section_Title/notes.md"
}
```

## 2. Create Folder

### Request

```bash
curl -X POST http://localhost:3000/api/create-folder \
-H "Content-Type: application/json" \
-d '{
  "path": "/path/to/new-folder"
}'
```

### Response

```json
{
  "message": "Folder created successfully at /path/to/new-folder."
}
```

## 3. Create File

### Request

```bash
curl -X POST http://localhost:3000/api/create-file \
-H "Content-Type: application/json" \
-d '{
  "path": "/path/to/file.md",
  "content": "# Sample Markdown Content"
}'
```

### Response

```json
{
  "message": "File created successfully at /path/to/file.md."
}
```

## 4. Get Course Structure

### Request

```bash
curl -X POST http://localhost:3000/api/get-course-structure \
-H "Content-Type: application/json" \
-d '{
  "baseFolder": "/path/to/course"
}'
```

### Response

```json
{
  "folderName": ["file1.md", "file2.md", "subfolder"],
  "subfolder": ["file3.md"]
}
