const validator = require('validator');
const emailMailingList = require('../models/emailMailingList.js');

const landingPage = (req, res) => {
    res.render('landingPage', { user: req.user });
};

const createSshKeyDashboard = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Email format is incorrect' });
        }

        const createdAt = new Date();
        const emailList = new emailMailingList({
            email,
            createdAt
        });
        
        await emailList.save();

        return res.json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('Error adding email to mailing list:', error);
        return res.status(500).json({ success: false, message: 'Error adding email to mailing list' });
    }
};

module.exports = {
    landingPage,
    createSshKeyDashboard,
};