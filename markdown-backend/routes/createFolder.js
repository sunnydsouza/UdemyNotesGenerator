const express = require('express');
const fs = require('fs').promises;

const router = express.Router();

// POST route to create a folder
router.post('/', async (req, res) => {
    const { path } = req.body;

    if (!path) {
        return res.status(400).json({ error: 'Path is required.' });
    }

    try {
        await fs.mkdir(path, { recursive: true }); // Create folder, including parent folders if needed
        res.status(200).json({ message: `Folder created successfully at ${path}.` });
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ error: 'Failed to create folder.', details: err.message });
    }
});

module.exports = router;
