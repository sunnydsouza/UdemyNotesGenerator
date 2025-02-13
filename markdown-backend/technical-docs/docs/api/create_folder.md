# Create Folder API

The Create Folder API allows users to create a new directory at the specified path.

## Endpoint

```
POST /api/create-folder
```

## Request Body

The request must include a JSON payload with the following field:

- `path`: The full path where the folder should be created.

### Example Request

```json
{
  "path": "/path/to/new-folder"
}
```

## Responses

- **200 OK**: The folder was created successfully.
  - Example response:
    ```json
    {
      "message": "Folder created successfully at /path/to/new-folder."
    }
    ```

- **400 Bad Request**: Missing required fields in the request body.
  - Example response:
    ```json
    {
      "error": "Path is required."
    }
    ```

- **500 Internal Server Error**: Failed to create the folder.
  - Example response:
    ```json
    {
      "error": "Failed to create folder.",
      "details": "Error message here."
    }
