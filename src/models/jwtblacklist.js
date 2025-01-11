const mongoose = require('mongoose');

const jwtblacklistSchema = new mongoose.Schema({
    jwt: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('JWTBlock', jwtblacklistSchema);