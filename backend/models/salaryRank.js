const mongoose = require('mongoose');

const salaryRankSchema = new mongoose.Schema({
    rank: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 9
    },
    name: {
        type: String,
        required: true
    },
    stars: {
        type: String,
        required: true
    },
    directVolume: {
        type: Number,
        required: true
    },
    teamVolume: {
        type: Number,
        required: true
    },
    requirement: {
        type: String,
        required: true
    },
    weeklySalary: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Static ranks data - UPDATED as per new structure
salaryRankSchema.statics.getRanks = function() {
    return [
        { rank: 1, stars: '⭐', directVolume: 750, teamVolume: 2500, requirement: 'None', weeklySalary: 25 },
        { rank: 2, stars: '⭐⭐', directVolume: 1500, teamVolume: 7500, requirement: '2 members at ⭐ Rank 1', weeklySalary: 60 },
        { rank: 3, stars: '⭐⭐⭐', directVolume: 3000, teamVolume: 25000, requirement: '2 members at ⭐⭐ Rank 2', weeklySalary: 150 },
        { rank: 4, stars: '⭐⭐⭐⭐', directVolume: 6000, teamVolume: 75000, requirement: '2 members at ⭐⭐⭐ Rank 3', weeklySalary: 350 },
        { rank: 5, stars: '⭐⭐⭐⭐⭐', directVolume: 10000, teamVolume: 250000, requirement: '2 members at ⭐⭐⭐⭐ Rank 4', weeklySalary: 900 },
        { rank: 6, stars: '⭐⭐⭐⭐⭐⭐', directVolume: 20000, teamVolume: 750000, requirement: '2 members at ⭐⭐⭐⭐⭐ Rank 5', weeklySalary: 2200 },
        { rank: 7, stars: '⭐⭐⭐⭐⭐⭐⭐', directVolume: 50000, teamVolume: 2500000, requirement: '2 members at ⭐⭐⭐⭐⭐⭐ Rank 6', weeklySalary: 5500 },
        { rank: 8, stars: '⭐⭐⭐⭐⭐⭐⭐⭐', directVolume: 100000, teamVolume: 7500000, requirement: '2 members at ⭐⭐⭐⭐⭐⭐⭐ Rank 7', weeklySalary: 13000 },
        { rank: 9, stars: '⭐⭐⭐⭐⭐⭐⭐⭐⭐', directVolume: 300000, teamVolume: 25000000, requirement: '2 members at ⭐⭐⭐⭐⭐⭐⭐⭐ Rank 8', weeklySalary: 30000 }
    ];
};

module.exports = mongoose.model('SalaryRank', salaryRankSchema);