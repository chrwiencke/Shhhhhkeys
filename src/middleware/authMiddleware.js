const jwt = require('jsonwebtoken');
const JWTBlock = require('../models/jwtblacklist.js');
const validator = require('validator');

const JWT_SECRET = process.env.JWT_SECRET;

const requireAuth = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/auth/login');
    }

    if (!validator.isJWT(token)) {
        console.log('JWT format is incorrect')
        return res.render("error.ejs", { errorMessage: 'Something went wrong, try to logout and login.' });
    }
    
    const tokenIsInBlacklist = await JWTBlock.findOne({ jwt: token });

    if (tokenIsInBlacklist) {
        console.log("Someone tried to use a blacklisted jwt token")
        res.clearCookie('jwt');
        res.redirect('/');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('jwt');
        res.redirect('/');
    }
};

const isSignedIn = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        return res.redirect('/dashboard/');
    }

    next();
};

module.exports = { requireAuth, isSignedIn };