const mongoose = require('mongoose');

const botSettingsSchema = new mongoose.Schema({
    // Trading Window (UTC)
    tradingStartHour: {
        type: Number,
        default: 9,
        min: 0,
        max: 23
    },
    tradingEndHour: {
        type: Number,
        default: 10,
        min: 0,
        max: 23
    },
    // Trading Duration in minutes
    tradeDurationMinutes: {
        type: Number,
        default: 1
    },
    // Income Distribution Delays
    stakingIncomeDelayMinutes: {
        type: Number,
        default: 60  // 1 hour after window closes
    },
    levelIncomeDelayMinutes: {
        type: Number,
        default: 10  // 10 minutes after staking income
    },
    // Bot Performance Stats
    totalTrades: {
        type: Number,
        default: 1247
    },
    winRate: {
        type: Number,
        default: 78
    },
    totalProfit: {
        type: Number,
        default: 3250
    },
    // Win/Loss Probability (for demo)
    winProbability: {
        type: Number,
        default: 78  // 78% chance of winning
    },
    updatedBy: {
        type: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BotSettings', botSettingsSchema);