const ShhKey = require('../models/shhkey.js');
const ShhKeyBlacklist = require('../models/sshkeytitleblacklist.js');
const validator = require('validator');

const profilePage = (req, res) => {
    res.render('profilePage', { user: req.user });
};

const mainDashboard = async (req, res) => {
    const username = req.user.username;

    const userKeys = await ShhKey.find(
        { username: username },
        'title key createdAt'
    );
    
    res.render('dashboard/mainPage', { userKeys, user: req.user });
};

const addShhKeyDashboard = async (req, res) => {
    res.render('dashboard/addShhKey', { user: req.user });
};

const createSshKeyDashboard = async (req, res) => {
    try {
        const { title, key } = req.body;
        const username = req.user.username;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        if (!validator.isLength(title, { min: 1, max: 100 })) {
            return res.status(400).json({ 
                message: 'Title must be between 1 and 100 characters' 
            });
        }

        const sanitizedTitle = validator.escape(title);

        if (!sanitizedTitle.match(/^[a-zA-Z0-9\s\-_]+$/)) {
            return res.status(400).json({ 
                message: 'Title can only contain letters, numbers, spaces, hyphens and underscores' 
            });
        }

        const titleInBlacklist = await ShhKeyBlacklist.findOne({ username, title: sanitizedTitle });

        if (titleInBlacklist) {
            return res.status(401).json({ message: 'Title has been created by the same user before' });
        }

        if (!key) {
            return res.status(400).json({ message: 'SSH key is required' });
        }

        const sshKeyRegex = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.+)?$/;
        
        if (!sshKeyRegex.test(key.trim())) {
            return res.status(400).json({ 
                message: 'Invalid SSH key format. Supported types: RSA, ED25519, ECDSA' 
            });
        }

        const keyParts = key.split(' ');
        if (keyParts[1] && keyParts[1].length < 44) {
            return res.status(400).json({ 
                message: 'SSH key is too short. Minimum 256 bits required' 
            });
        }

        if (key.length > 16384) {
            return res.status(400).json({ 
                message: 'SSH key is too long. Maximum size is 16KB' 
            });
        }

        const titleExists = await ShhKey.findOne({ username, title: sanitizedTitle });
        if (titleExists) {
            return res.status(400).json({ message: 'Title already exists' });
        }

        const userKeyCount = await ShhKey.countDocuments({ username });
        const MAX_KEYS_PER_USER = 1088;
        
        if (userKeyCount >= MAX_KEYS_PER_USER) {
            return res.status(400).json({ 
                message: `Maximum number of SSH keys (${MAX_KEYS_PER_USER}) reached` 
            });
        }

        const createdAt = new Date();
        const sshkey = new ShhKey({
            username,
            title: sanitizedTitle,
            key: key.trim(),
            createdAt
        });
        
        await sshkey.save();

        res.redirect('/dashboard/');
    } catch (error) {
        console.error('SSH Key creation error:', error);
        res.status(500).json({ message: 'Error creating SSH Key' });
    }
};

const deleteSshKeyDashboard = async (req, res) => {
    try {
        const username = req.user.username;
        const id = req.params['id'];

        if (!validator.isMongoId(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const idExists = await ShhKey.findOne({ _id: id });

        if (!idExists) {
            return res.status(400).json({ message: 'ID does not exist' });
        }

        if (idExists.username !== username) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const title = idExists.title

        const sshkeyBlacklist = new ShhKeyBlacklist({
            username,
            title
        });

        await sshkeyBlacklist.save();

        await ShhKey.deleteOne({ _id: id });
        res.redirect('/dashboard/');
    } catch (error) {
        console.error('SSH Key deletion error:', error);
        res.status(500).json({ message: 'Error deleting SSH Key' });
    }
};

module.exports = {
    profilePage,
    mainDashboard,
    addShhKeyDashboard,
    createSshKeyDashboard,
    deleteSshKeyDashboard
};