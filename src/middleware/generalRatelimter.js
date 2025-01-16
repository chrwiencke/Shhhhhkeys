const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 10 attempts
    message: {
        status: 429,
        message: 'Too many get requests, please try again after 1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter };