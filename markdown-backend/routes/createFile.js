const express = require('express');
const fs = require('fs').promises;

const router = express.Router();

// POST route to create a file
router.post('/', async (req, res) => {
    const { path, content } = req.body;

    if (!path || content === undefined) {
        return res.status(400).json({ error: 'Path and content are required.' });
    }

    try {
        await fs.writeFile(path, content, 'utf8'); // Write content to the specified file
        res.status(200).json({ message: `File created successfully at ${path}.` });
    } catch (err) {
        console.error('Error creating file:', err);
        res.status(500).json({ error: 'Failed to create file.', details: err.message });
    }
});

module.exports = router;
