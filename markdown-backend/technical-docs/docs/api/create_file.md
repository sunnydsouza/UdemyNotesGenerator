# Create File API

The Create File API allows users to create a new file in the specified directory.

## Endpoint

```
POST /api/create-file
```

## Request Body

The request must include a JSON payload with the following fields:

- `path`: The full path where the file should be created.
- `content`: The content to be written to the file.

### Example Request

```json
{
  "path": "/path/to/file.md",
  "content": "# Sample Markdown Content"
}
```

## Responses

- **200 OK**: The file was created successfully.
  - Example response:
    ```json
    {
      "message": "File created successfully at /path/to/file.md."
    }
    ```

- **400 Bad Request**: Missing required fields in the request body.
  - Example response:
    ```json
    {
      "error": "Path and content are required."
    }
    ```

- **500 Internal Server Error**: Failed to create the file.
  - Example response:
    ```json
    {
      "error": "Failed to create file.",
      "details": "Error message here."
    }
