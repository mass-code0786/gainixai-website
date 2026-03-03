const mongoose = require('mongoose');

const levelIncomeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fromUserId: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    amount: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    sourceAmount: {
        type: Number,
        required: true
    },
    sourceType: {
        type: String,
        enum: ['staking_roi', 'referral_bonus'],
        default: 'staking_roi'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LevelIncome', levelIncomeSchema);