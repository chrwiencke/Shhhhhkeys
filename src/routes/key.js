const express = require('express');
const router = express.Router();
const ShhKey = require('../models/shhkey.js');

router.get('/:user/:title', async (req, res) => {
    try {
        const title = req.params.title;
        const user = req.params.user;

        if (!title) {
            return res.status(400).json({ message: 'No title found' });
        }
        if (!user) {
            return res.status(400).json({ message: 'No user found' });
        }

        const data = await ShhKey.findOne({ username: user, title });
        
        if (!data) {
            return res.status(404).json({ message: 'SSH Key not found' });
        }

        if (!data.shareable) {
            return res.status(403).json({ message: 'SSH Key is disabled' });
        }

        const sshKey = data.key;
        res.send(sshKey);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error retrieving SSH Key' });
    }
});

exports.router = router;