const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcrypt');
const User = require('../models/user.js');
const JWTBlock = require('../models/jwtblacklist.js');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const postRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!validator.isLength(username, { min: 3, max: 30 })) {
            return res.status(400).json({ message: 'Username must be between 3 and 30 characters' });
        }
        if (!username.match(/^[a-zA-Z0-9_]+$/)) {
            return res.status(400).json({ message: 'Username can only contain letters, numbers and underscores' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Email format is incorrect' });
        }

        if (!validator.isLength(password, { min: 8, max: 100 })) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
            return res.status(400).json({ 
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character' 
            });
        }
        
        if (username === "auth" || username === "dashboard" || username === "about") {
            return res.status(400).json({ message: 'Cannot be named this' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
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
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
};

const postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const sanitizedUsername = validator.escape(username);
        
        const user = await User.findOne({ username: sanitizedUsername });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ 
            userId: user._id, 
            username: user.username,
            email: user.email
        }, JWT_SECRET, { 
            expiresIn: '24h',
            algorithm: 'HS256'
        });

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect('/dashboard/');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        
        if (!token) {
            return res.status(400).json({ message: 'No token found' });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            res.clearCookie('jwt');
            return res.redirect('/');
        }

        const tokendb = new JWTBlock({ jwt: token });
        await tokendb.save();

        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        res.redirect('/');
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error logging out' });
    }
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