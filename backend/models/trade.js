const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 10
    },
    direction: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    entryPrice: {
        type: Number,
        required: true
    },
    exitPrice: {
        type: Number
    },
    profit: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'cancelled'],
        default: 'open'
    },
    result: {
        type: String,
        enum: ['win', 'loss', 'pending'],
        default: 'pending'
    },
    windowDate: {
        type: Date,
        required: true
    },
    closedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Trade', tradeSchema);