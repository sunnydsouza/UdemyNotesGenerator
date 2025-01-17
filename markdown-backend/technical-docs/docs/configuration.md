# Configuration

The `markdown-backend` may require certain configuration settings to operate correctly. Below are the details regarding environment variables and configuration files.

## Environment Variables

The following environment variables can be set to customize the behavior of the backend:

- **PORT**: The port on which the server will run. Default is `3000`.
- **BASE_FOLDER**: The root folder where markdown files will be stored. This can be set to ensure that files are organized in a specific directory.

### Example Configuration

You can create a `.env` file in the root of your project to set these variables:

```
PORT=3000
BASE_FOLDER=/path/to/your/base/folder
```

## Configuration Files

The backend does not require any specific configuration files beyond the standard Node.js setup. However, you may choose to implement additional configuration files as needed for your application.
