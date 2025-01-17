# Development

The `markdown-backend` is designed to be easily extendable and maintainable. Below are guidelines for contributing to the project and understanding its code structure.

## Code Structure

- **server.js**: The main entry point of the application, where the Express server is initialized and routes are defined.
- **routes/**: Contains all the route handlers for the API endpoints.
  - `saveMarkdown.js`: Handles saving markdown files.
  - `createFolder.js`: Manages folder creation.
  - `createFile.js`: Manages file creation.
  - `getCourseStructure.js`: Retrieves the course structure.
- **utils/**: Contains utility functions that support the core functionality of the backend.
  - `fileUtils.js`: Includes functions for file operations, such as saving markdown files and sanitizing names.

## Contributing

1. **Fork the Repository**: Create a personal copy of the repository on GitHub.
2. **Clone the Repository**: Clone your forked repository to your local machine.
   ```bash
   git clone <your-fork-url>
   ```
3. **Create a Branch**: Create a new branch for your feature or bug fix.
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make Changes**: Implement your changes and ensure that they are well-tested.
5. **Commit Changes**: Commit your changes with a descriptive message.
   ```bash
   git commit -m "Add a new feature"
   ```
6. **Push Changes**: Push your changes to your forked repository.
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**: Open a pull request to the main repository for review.

## Testing

- Ensure that all new features are covered by tests.
- Run existing tests to verify that your changes do not break any functionality.
