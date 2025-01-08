const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// POST route to get course structure
router.post('/', async (req, res) => {
    const { baseFolder } = req.body;

    if (!baseFolder) {
        return res.status(400).json({ error: 'Base folder is required.' });
    }

    try {
        const structure = await getCourseStructure(baseFolder);
        res.status(200).json(structure);
    } catch (err) {
        console.error('Error retrieving course structure:', err);
        res.status(500).json({ error: 'Failed to retrieve course structure.', details: err.message });
    }
});

// Helper function to get folder and file structure
async function getCourseStructure(baseFolder) {
    const structure = {};

    async function readFolder(folderPath) {
        const entries = await fs.readdir(folderPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(folderPath, entry.name);

            if (entry.isDirectory()) {
                structure[entry.name] = []; // Add directory to structure
                await readFolder(fullPath); // Recursively read subfolders
            } else if (entry.isFile()) {
                const folderName = path.basename(folderPath);
                if (!structure[folderName]) structure[folderName] = [];
                structure[folderName].push(entry.name); // Add file to the corresponding folder
            }
        }
    }

    await readFolder(baseFolder);
    return structure;
}

module.exports = router;
