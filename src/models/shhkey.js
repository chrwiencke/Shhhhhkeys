const mongoose = require('mongoose');

const shhKeySchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
        match: /^[a-zA-Z0-9\s\-_]+$/
    },
    key: {
        type: String,
        required: true,
        trim: true,
        maxlength: 16384,
        validate: {
            validator: function(v) {
                return /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.+)?$/.test(v);
            },
            message: props => `${props.value} is not a valid SSH key!`
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique titles per user
shhKeySchema.index({ username: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('ShhKey', shhKeySchema);