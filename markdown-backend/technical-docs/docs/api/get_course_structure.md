# Get Course Structure API

The Get Course Structure API allows users to retrieve the folder and file structure of a specified base directory.

## Endpoint

```
POST /api/get-course-structure
```

## Request Body

The request must include a JSON payload with the following field:

- `baseFolder`: The root folder from which the structure should be retrieved.

### Example Request

```json
{
  "baseFolder": "/path/to/course"
}
```

## Responses

- **200 OK**: The course structure was retrieved successfully.
  - Example response:
    ```json
    {
      "folderName": ["file1.md", "file2.md", "subfolder"],
      "subfolder": ["file3.md"]
    }
    ```

- **400 Bad Request**: Missing required fields in the request body.
  - Example response:
    ```json
    {
      "error": "Base folder is required."
    }
    ```

- **500 Internal Server Error**: Failed to retrieve the course structure.
  - Example response:
    ```json
    {
      "error": "Failed to retrieve course structure.",
      "details": "Error message here."
    }
