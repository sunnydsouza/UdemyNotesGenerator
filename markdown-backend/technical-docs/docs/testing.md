# Testing

The `markdown-backend` includes a testing framework to ensure the reliability and correctness of the application. Below are guidelines for running tests and adding new ones.

## Testing Framework

The backend uses [Jest](https://jestjs.io/) as the testing framework. Jest is a delightful JavaScript testing framework with a focus on simplicity.

## Running Tests

To run the existing tests, use the following command:

```bash
npm test
```

This command will execute all test files located in the `__tests__` directory or any files with `.test.js` or `.spec.js` extensions.

## Writing Tests

When adding new features or fixing bugs, it is essential to write corresponding tests. Follow these guidelines:

1. **Create a Test File**: Create a new test file in the `__tests__` directory or alongside the module being tested with a `.test.js` extension.

2. **Import Required Modules**: Import the necessary modules and the module you want to test.

3. **Write Test Cases**: Use Jest's `test` or `it` functions to define your test cases. Use `expect` to assert the expected outcomes.

### Example Test

```javascript
const request = require('supertest');
const app = require('../server'); // Import the Express app

describe('POST /api/save-markdown', () => {
    it('should save markdown file successfully', async () => {
        const response = await request(app)
            .post('/api/save-markdown')
            .send({
                baseFolder: '/path/to/course',
                courseTitle: 'Course Title',
                sectionTitle: 'Section Title',
                fileName: 'notes.md',
                content: '# Sample Markdown Content'
            });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('File saved successfully!');
    });
});
```

## Best Practices

- Ensure that tests are isolated and do not depend on external state.
- Use descriptive names for test cases to clarify their purpose.
- Run tests frequently during development to catch issues early.
