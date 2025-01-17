# Save Markdown API

The Save Markdown API allows users to save markdown content to a specified file within a structured folder hierarchy.

## Endpoint

```
POST /api/save-markdown
```

## Request Body

The request must include a JSON payload with the following fields:

- `baseFolder`: The root folder where the markdown file will be stored.
- `courseTitle`: The title of the course.
- `sectionTitle`: The title of the section.
- `fileName`: The name of the markdown file.
- `content`: The content to be written in the markdown file.

### Example Request

```json
{
  "baseFolder": "/path/to/course",
  "courseTitle": "Course Title",
  "sectionTitle": "Section Title",
  "fileName": "notes.md",
  "content": "# Sample Markdown Content"
}
```

## Responses

- **200 OK**: The markdown file was saved successfully.
  - Example response:
    ```json
    {
      "message": "File saved successfully!",
      "filePath": "/path/to/course/Course_Title/Section_Title/notes.md"
    }
    ```

- **400 Bad Request**: Missing required fields in the request body.
  - Example response:
    ```json
    {
      "error": "Missing required fields"
    }
    ```

- **500 Internal Server Error**: Failed to save the markdown file.
  - Example response:
    ```json
    {
      "error": "Failed to save the markdown file",
      "details": "Error message here."
    }
