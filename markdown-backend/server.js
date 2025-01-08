const express = require('express');
const cors = require('cors'); // Import CORS middleware

const saveMarkdownRoute = require('./routes/saveMarkdown');
const createFolderRoute = require('./routes/createFolder');
const createFileRoute = require('./routes/createFile');
const getCourseStructureRoute = require('./routes/getCourseStructure');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: '*' })); // Allow requests from any origin
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use('/api/save-markdown', saveMarkdownRoute);
app.use('/api/create-folder', createFolderRoute);
app.use('/api/create-file', createFileRoute);
app.use('/api/get-course-structure', getCourseStructureRoute);

// Start server
app.listen(PORT, () => {
    console.log(`Markdown backend running at http://localhost:${PORT}`);
});
