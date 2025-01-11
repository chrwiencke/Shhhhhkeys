const mongoose = require('mongoose');

const ShhKeySchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    createdAt: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('ShhKey', ShhKeySchema);