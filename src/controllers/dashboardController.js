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

module.exports = {
    profilePage,
    mainDashboard,
    addShhKeyDashboard
};