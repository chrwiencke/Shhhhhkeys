const jwt = require('jsonwebtoken');
const JWTBlock = require('../models/jwtblacklist.js');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const requireAuth = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/');
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

module.exports = { requireAuth };