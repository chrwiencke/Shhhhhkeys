const ShhKey = require('../models/shhkey.js');

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
        const username = req.user.username

        const titleExists = await ShhKey.findOne({ username, title });
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
};

const deleteSshKeyDashboard = async (req, res) => {
    try {
        const username = req.user.username
        const id = req.params['id']

        const idExists = await ShhKey.findOne({ _id: id });

        if (!idExists) {
            return res.status(400).json({ message: 'Id does not exist' });
        }

        if (!idExists.username === username){
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        await ShhKey.deleteOne({ _id: id });
        res.redirect('/dashboard/');
    } catch (error) {
        console.log(error)
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