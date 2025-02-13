const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// POST route to append messages to a log file
router.post('/', async (req, res) => {
    const { path: filePath, content } = req.body;

    if (!filePath || !content) {
        return res.status(400).json({ error: 'Path and content are required.' });
    }

    try {
        // Ensure directory exists
        const directory = path.dirname(filePath);
        await fs.mkdir(directory, { recursive: true });

        // Append the log message to the file
        await fs.appendFile(filePath, content);
        res.status(200).json({ message: 'Log appended successfully.' });
    } catch (err) {
        console.error('Error appending to log file:', err);
        res.status(500).json({ error: 'Failed to append to log file.', details: err.message });
    }
});

module.exports = router;