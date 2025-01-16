const mongoose = require('mongoose');

const shhKeySocialSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ShhKeySocial', shhKeySocialSchema);