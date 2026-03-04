const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['p2p_sent', 'p2p_received', 'deposit', 'withdraw', 'staking', 'referral', 'salary', 'level'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    fromUserId: {
        type: String
    },
    toUserId: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);