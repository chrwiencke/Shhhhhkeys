const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    verificationTokenEmail: {
        type: String,
        required: false,
        default: undefined
    },
    verificationTokenPassword: {
        type: String,
        required: false,
        default: undefined
    },
    verificationTokenChangeEmail: {
        type: String,
        required: false,
        default: undefined
    },
    newEmail: {
        type: String,
        required: false,
        default: undefined
    },

});

module.exports = mongoose.model('User', userSchema);