const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.js');
const JWTBlock = require('../models/jwtblacklist.js');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const postRegister = async (req, res) => {
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
};

const postLogin = async (req, res) => {
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

        res.redirect('/dashboard/');
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
};

const logout = async (req, res) => {
    const token = req.cookies.jwt;

    const existingToken = await User.findOne({ token });
    if (existingToken) {
        return res.status(400).json({ message: 'Token already exists' });
    }

    const tokendb = new JWTBlock({ jwt: token });
    
    await tokendb.save();

    res.clearCookie('jwt');
    res.redirect('/');
};

const loginPage = (req, res) => {
    res.render('loginPage');
};

const registerPage = (req, res) => {
    res.render('registerPage');
};

module.exports = {
    postRegister,
    postLogin,
    loginPage,
    registerPage,
    logout
};