const express = require('express');
const { saveMarkdownFile } = require('../utils/fileUtils');

const router = express.Router();

router.post('/', async (req, res) => {
    const { baseFolder, courseTitle, sectionTitle, fileName, content } = req.body;

    // Validate inputs
    if (!baseFolder || !courseTitle || !sectionTitle || !fileName || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Save the markdown file
        const filePath = await saveMarkdownFile(baseFolder, courseTitle, sectionTitle, fileName, content);
        res.status(200).json({ message: 'File saved successfully!', filePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save the markdown file' });
    }
});

module.exports = router;
