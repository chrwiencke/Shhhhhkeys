const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.js');
const indexController = require('../controllers/indexController.js');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Auth Paths
router.get('/login', indexController.loginPage);
router.get('/register', indexController.registerPage);

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const saltstuff = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltstuff);
        
        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        
        await user.save();
        res.redirect('/auth/login');
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ 
            userId: user._id, 
            username: user.username,
            email: user.email
        }, JWT_SECRET, { 
            expiresIn: '24h' 
        });

        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect('/dashboard/profile');
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
});

module.exports = { router };
exports.router = router;