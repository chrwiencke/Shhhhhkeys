const mongoose = require('mongoose');

const jwtblacklistSchema = new mongoose.Schema({
    jwt: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours in seconds (24 * 60 * 60)
    }
});

module.exports = mongoose.model('JWTBlock', jwtblacklistSchema);