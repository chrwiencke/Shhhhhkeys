const mongoose = require('mongoose');

const shhKeyBlacklistSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    }
});

shhKeyBlacklistSchema.index({ username: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('ShhKeyBlacklist', shhKeyBlacklistSchema);