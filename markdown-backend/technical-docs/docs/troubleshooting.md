# Troubleshooting

This section provides solutions to common issues that may arise while using the `markdown-backend`.

## Common Issues

### 1. Server Not Starting

**Symptoms**: The server fails to start, and you see an error message in the console.

**Solutions**:
- Ensure that you have installed all dependencies by running `npm install`.
- Check for any syntax errors in your code. Review the console output for specific error messages.
- Make sure that the port specified in the environment variables is not already in use.

### 2. API Requests Failing

**Symptoms**: API requests return a 400 or 500 status code.

**Solutions**:
- Verify that you are sending the correct request format and including all required fields in the request body.
- Check the server logs for any error messages that may indicate what went wrong.
- Ensure that the server is running and accessible at the specified endpoint.

### 3. File Not Saving

**Symptoms**: The markdown file is not being saved as expected.

**Solutions**:
- Ensure that the `baseFolder` path provided in the request is valid and accessible.
- Check the permissions of the directory where you are trying to save the file. Make sure the application has write access.
- Review the server logs for any errors related to file operations.

### 4. Folder Structure Not Retrieving

**Symptoms**: The course structure API returns an empty response or an error.

**Solutions**:
- Verify that the `baseFolder` provided in the request exists and contains files or folders.
- Check the server logs for any errors that may indicate issues with reading the directory.

## Additional Resources

- Consult the [Node.js documentation](https://nodejs.org/en/docs/) for more information on file system operations.
- Review the [Express documentation](https://expressjs.com/en/4x/api.html) for details on routing and middleware.

If you encounter issues not covered in this section, consider reaching out to the community or checking online forums for assistance.
