const ShhKey = require('../models/shhkey.js');
const socialKeys = require('../models/socialKeys.js');
const ShhKeyBlacklist = require('../models/sshkeytitleblacklist.js');
const validator = require('validator');

const profilePage = (req, res) => {
    res.render('profile/profilePage', { user: req.user });
};

const changePassword = (req, res) => {
    res.render('profile/changePassword', { user: req.user });
};
const getChangeEmail = (req, res) => {
    res.render('profile/changeEmail', { user: req.user });
};

const mainDashboard = async (req, res) => {
    const username = req.user.username;

    const userKeys = await ShhKey.find(
        { username: username },
        'title key shareable editable createdAt'
    );
    
    const userSocialKeys = await socialKeys.find(
        { username: username },
        'link'
    );

    res.render('dashboard/mainPage', { userKeys, userSocialKeys, user: req.user });
};


const addShhKeyDashboard = async (req, res) => {
    res.render('dashboard/addShhKey', { user: req.user });
};

const addSocialShhKeyDashboard = async (req, res) => {
    res.render('dashboard/addSocialShhKey', { user: req.user });
};

const createSshKeyDashboard = async (req, res) => {
    try {
        const { title, key } = req.body;
        const editable = req.body.editable !== undefined;
        const username = req.user.username;

        if (!title) {
            return res.render("error.ejs", { errorMessage: 'Title is required' });
        }

        if (title === "keys") {
            return res.render("error.ejs", { errorMessage: 'Cannot be named this' });
        }

        if (!validator.isLength(title, { min: 1, max: 100 })) {
            return res.render("error.ejs", { errorMessage: 'Title must be between 1 and 100 characters' });
        }

        const sanitizedTitle = validator.escape(title);

        if (!sanitizedTitle.match(/^[a-zA-Z0-9\-_]+$/)) {
            return res.render("error.ejs", { errorMessage: 'Title can only contain letters, numbers, hyphens and underscores (no spaces)' });
        }

        const titleInBlacklist = await ShhKeyBlacklist.findOne({ username, title: sanitizedTitle });

        if (titleInBlacklist) {
            return res.render("error.ejs", { errorMessage: 'Title has been created by the same user before' });
        }

        if (!key) {
            return res.render("error.ejs", { errorMessage: 'SSH key is required' });
        }

        const sshKeyRegex = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.+)?$/;
        
        if (!sshKeyRegex.test(key.trim())) {
            return res.render("error.ejs", { errorMessage: 'Invalid SSH key format. Supported types: RSA, ED25519, ECDSA' });
        }

        const keyParts = key.split(' ');
        if (keyParts[1] && keyParts[1].length < 44) {
            return res.render("error.ejs", { errorMessage: 'SSH key is too short. Minimum 256 bits required' });
        }

        if (key.length > 16384) {
            return res.render("error.ejs", { errorMessage: 'SSH key is too long. Maximum size is 16KB' });
        }

        const titleExists = await ShhKey.findOne({ username, title: sanitizedTitle });
        if (titleExists) {
            return res.render("error.ejs", { errorMessage: 'Title already exists' });
        }

        const userKeyCount = await ShhKey.countDocuments({ username });
        const MAX_KEYS_PER_USER = 1088;
        
        if (userKeyCount >= MAX_KEYS_PER_USER) {
            return res.render("error.ejs", { errorMessage: `Maximum number of SSH keys (${MAX_KEYS_PER_USER}) reached` });
        }

        const createdAt = new Date();
        const sshkey = new ShhKey({
            username,
            title: sanitizedTitle,
            key: key,
            editable,
            createdAt
        });
        
        await sshkey.save();

        res.redirect('/dashboard/');
    } catch (error) {
        console.error('SSH Key creation error:', error);
        res.status(500).json({ message: 'Error creating SSH Key' });
    }
};

const editSshKeyDashboard = async (req, res) => {
    try {
        const { title, key } = req.body;
        const username = req.user.username;

        if (!title) {
            return res.render("error.ejs", { errorMessage: 'Something went wrong' });
        }

        if (!key) {
            return res.render("error.ejs", { errorMessage: 'SSH key is required' });
        }

        const sshKeyRegex = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.+)?$/;
        
        if (!sshKeyRegex.test(key.trim())) {
            return res.render("error.ejs", { errorMessage: 'Invalid SSH key format. Supported types: RSA, ED25519, ECDSA' });
        }

        const keyParts = key.split(' ');
        if (keyParts[1] && keyParts[1].length < 44) {
            return res.render("error.ejs", { errorMessage: 'SSH key is too short. Minimum 256 bits required' });
        }

        if (key.length > 16384) {
            return res.render("error.ejs", { errorMessage: 'SSH key is too long. Maximum size is 16KB' });
        }

        const sshKey = await ShhKey.findOne({ username, title });

        if (!sshKey) {
            return res.render("error.ejs", { errorMessage: 'SSH key not found' });
        }

        if (sshKey.editable) {
            await ShhKey.findByIdAndUpdate(sshKey._id, { 
                $set: { key }
            });
            return res.redirect('/dashboard/');
        }

        return res.render("error.ejs", { errorMessage: 'Key is not editable' });

    } catch (error) {
        console.error('SSH Key edit error:', error);
        res.status(500).json({ message: 'Error editing SSH Key' });
    }
};

const deleteSshKeyDashboard = async (req, res) => {
    try {
        const username = req.user.username;
        const id = req.params['id'];

        if (!validator.isMongoId(id)) {
            return res.render("error.ejs", { errorMessage: 'Invalid ID format' });
        }

        const idExists = await ShhKey.findOne({ _id: id });

        if (!idExists) {
            return res.render("error.ejs", { errorMessage: 'ID does not exist' });
        }

        if (idExists.username !== username) {
            return res.render("error.ejs", { errorMessage: 'Not authorized' });
        }

        if (!idExists.editable) {
            const title = idExists.title;
            const sshkeyBlacklist = new ShhKeyBlacklist({
                username,
                title
            });
            await sshkeyBlacklist.save();
        }

        await ShhKey.deleteOne({ _id: id });
        res.redirect('/dashboard/');
    } catch (error) {
        console.error('SSH Key deletion error:', error);
        res.status(500).json({ message: 'Error deleting SSH Key' });
    }
};

const enabledisableSshKeyDashboard = async (req, res) => {
    try {
        const username = req.user.username;
        const id = req.params['id'];

        if (!validator.isMongoId(id)) {
            return res.render("error.ejs", { errorMessage: 'Invalid ID format' });
        }

        const idExists = await ShhKey.findOne({ _id: id });

        if (!idExists) {
            return res.render("error.ejs", { errorMessage: 'ID does not exist' });
        }

        if (idExists.username !== username) {
            return res.render("error.ejs", { errorMessage: 'Not authorized' });
        }

        await ShhKey.findByIdAndUpdate(id, { 
            $set: { shareable: !idExists.shareable }
        });

        res.redirect('/dashboard/');    
    } catch (error) {
        console.error('SSH Key enable/disable error:', error);
        res.status(500).json({ message: 'Error enable/disable SSH Key' });
    }
};

const createSocialSshKeyDashboard = async (req, res) => {
    try {
        let { link } = req.body;
        const username = req.user.username;

        if (!link) {
            return res.render("error.ejs", { errorMessage: 'Link is required' });
        }

        link = link.replace(/\/+$/, '');

        const linkRegex = /^(https?:\/\/)?(shh\.pludo\.org)(\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)$/;
        const match = link.match(linkRegex);

        if (!match) {
            return res.render("error.ejs", { errorMessage: 'Invalid link format. Must be a valid shh.pludo.org URL with user/title pattern' });
        }

        link = `https://${match[2]}${match[3]}`;

        const linkExists = await socialKeys.findOne({ username, link });
        if (linkExists) {
            return res.render("error.ejs", { errorMessage: 'Link already exists' });
        }

        const userKeyCount = await socialKeys.countDocuments({ username });
        const MAX_LINKS_PER_USER = 1088;
        
        if (userKeyCount >= MAX_LINKS_PER_USER) {
            return res.render("error.ejs", { errorMessage: `Maximum number of SSH keys (${MAX_LINKS_PER_USER}) reached` });
        }

        const createdAt = new Date();
        const newSocialkey = new socialKeys({
            username,
            link,
            createdAt
        });
        
        await newSocialkey.save();

        res.redirect('/dashboard/');
    } catch (error) {
        console.error('Social Key creation error:', error);
        res.status(500).json({ message: 'Error creating Social SSH Key' });
    }
};

const deleteSocialSshKeyDashboard = async (req, res) => {
    try {
        const username = req.user.username;
        const id = req.params['id'];

        if (!validator.isMongoId(id)) {
            return res.render("error.ejs", { errorMessage: 'Invalid ID format' });
        }

        const idExists = await socialKeys.findOne({ _id: id });

        if (!idExists) {
            return res.render("error.ejs", { errorMessage: 'ID does not exist' });
        }

        if (idExists.username !== username) {
            return res.render("error.ejs", { errorMessage: 'Not authorized' });
        }

        await socialKeys.deleteOne({ _id: id });
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
    deleteSshKeyDashboard,
    enabledisableSshKeyDashboard,
    changePassword,
    addSocialShhKeyDashboard,
    createSocialSshKeyDashboard,
    deleteSocialSshKeyDashboard,
    getChangeEmail,
    editSshKeyDashboard,
};