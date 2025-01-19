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
        default: undefined,
        expires: 86400 // 24 hours in seconds
    },
    verificationTokenChangeEmail: {
        type: String,
        required: false,
        default: undefined,
        expires: 86400 // 24 hours in seconds
    },
    newEmail: {
        type: String,
        required: false,
        default: undefined
    },
});

// TTL indexes
userSchema.index({ "verificationTokenPassword": 1 }, { expireAfterSeconds: 86400 });
userSchema.index({ "verificationTokenChangeEmail": 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('User', userSchema);