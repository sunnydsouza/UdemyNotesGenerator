const express = require('express');
const fs = require('fs').promises;

const router = express.Router();

// POST route to check if a file exists
router.post('/', async (req, res) => {
    const { path } = req.body;

    if (!path) {
        return res.status(400).json({ error: 'Path is required.' });
    }

    try {
        // Check if the file exists
        await fs.access(path);
        res.status(200).json({ exists: true });
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File does not exist
            res.status(200).json({ exists: false });
        } else {
            console.error('Error checking file existence:', err);
            res.status(500).json({ error: 'Failed to check file.', details: err.message });
        }
    }
});

module.exports = router;
