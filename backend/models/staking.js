const mongoose = require('mongoose');

const stakingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    package: {
        type: String,
        enum: ['BASIC', 'PRO', 'ELITE'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 20
    },
    dailyROI: {
        type: Number,
        required: true
    },
    dailyPercentage: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    period: {
        type: Number, // days: 90, 180, 450
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'UNSTAKED'],
        default: 'ACTIVE'
    },
    totalROIEarned: {
        type: Number,
        default: 0
    },
    lastROITime: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate end date based on package
stakingSchema.pre('save', function(next) {
    if (!this.endDate) {
        const start = new Date(this.startDate);
        this.endDate = new Date(start.setDate(start.getDate() + this.period));
    }
    next();
});

module.exports = mongoose.model('Staking', stakingSchema);