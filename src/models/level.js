const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    grade: {
        type: Number,
        min: 0,
        max: 3,
        required: true
    }
});

const levelSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    levels: [{
        levelNumber: {
            type: Number,
            required: true
        },
        milestones: [milestoneSchema]
    }]
});

module.exports = mongoose.model('Level', levelSchema);