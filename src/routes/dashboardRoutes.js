const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const ShhKey = require('../models/shhkey.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

// Dashboard
router.get('/profile', requireAuth, dashboardController.profilePage);
router.get('/add-ssh-key', requireAuth, dashboardController.addShhKeyDashboard);

router.get('/', requireAuth, dashboardController.mainDashboard);


router.post('/create-ssh-key', requireAuth, async (req, res) => {
    try {
        const { title, key } = req.body;
        const username = req.user.username

        const titleExists = await ShhKey.findOne({ title });
        if (titleExists) {
            return res.status(400).json({ message: 'Title already exists' });
        }

        const createdAt = new Date()
        const sshkey = new ShhKey({
            username,
            title,
            key,
            createdAt
        });
        
        await sshkey.save();

        res.redirect('/dashboard/');
    } catch (error) {
        res.status(500).json({ message: 'Error creating SSH Key' });
    }
});

exports.router = router;