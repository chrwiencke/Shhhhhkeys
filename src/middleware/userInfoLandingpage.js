const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const userInfoLandingPage = async (req, res, next) => {
    const token = req.cookies.jwt;
    
    if (!token) {
        req.user = {
            username: "username"
        };
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        req.user = {
            username: "username"
        };
    }
    next();
};

module.exports = { userInfoLandingPage };