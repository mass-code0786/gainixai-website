const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    // Staking Packages
    basicMinAmount: { type: Number, default: 20 },
    basicRoiMin: { type: Number, default: 1.0 },
    basicRoiMax: { type: Number, default: 1.3 },
    basicReferralBonus: { type: Number, default: 5 },
    basicPeriod: { type: Number, default: 90 },

    proMinAmount: { type: Number, default: 150 },
    proRoiMin: { type: Number, default: 1.3 },
    proRoiMax: { type: Number, default: 1.6 },
    proReferralBonus: { type: Number, default: 7 },
    proPeriod: { type: Number, default: 180 },

    eliteMinAmount: { type: Number, default: 300 },
    eliteRoiMin: { type: Number, default: 1.5 },
    eliteRoiMax: { type: Number, default: 2.0 },
    eliteReferralBonus: { type: Number, default: 10 },
    elitePeriod: { type: Number, default: 450 },
    eliteSpecialBonusEnabled: { type: Boolean, default: true },
    eliteSpecialBonusAmount: { type: Number, default: 100 },
    eliteSpecialBonusThreshold: { type: Number, default: 500 },

    // Trading Bot
    botTradingStartHour: { type: Number, default: 9 },
    botTradingEndHour: { type: Number, default: 10 },
    botEnabled: { type: Boolean, default: true },
    botClosedSunday: { type: Boolean, default: true },

    // Fees
    withdrawalFeePercent: { type: Number, default: 10 },
    minWithdrawal: { type: Number, default: 10 },
    maxWithdrawal: { type: Number, default: 10000 },

    // Level Income Percentages
    level1Percent: { type: Number, default: 10 },
    level2Percent: { type: Number, default: 7 },
    level3Percent: { type: Number, default: 5 },
    level4Percent: { type: Number, default: 3 },
    level5Percent: { type: Number, default: 1 },

    // Salary Ranks (Dynamic)
    rankSettings: { type: Object, default: {} },

    // System
    maintenanceMode: { type: Boolean, default: false },
    allowNewRegistrations: { type: Boolean, default: true },

    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);