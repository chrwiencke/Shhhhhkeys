const express = require('express');
const router = express.Router();
const ShhKey = require('../models/shhkey.js');

// Get SSH Key
router.get('/:title', async (req, res) => {
    try {
        const title = req.params['title']

        if (!title) {
            return res.status(400).json({ message: 'No title found' });
        }

        const data = await ShhKey.findOne({ title });

        const sshKey = data.key

        res.send('sshKey');
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error deleting SSH Key' });
    }
});

exports.router = router;