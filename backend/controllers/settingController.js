const Setting = require('../models/Setting');

// ============================================
// GET ALL SETTINGS
// ============================================
const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        
        // Agar settings nahi hain to default banao
        if (!settings) {
            settings = await Setting.create({});
        }

        res.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE SETTINGS
// ============================================
const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        
        let settings = await Setting.findOne();
        
        if (!settings) {
            settings = new Setting();
        }

        // Har field ko update karo
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                settings[key] = updates[key];
            }
        });

        settings.updatedBy = req.admin.username;
        settings.updatedAt = new Date();

        await settings.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE STAKING PACKAGES
// ============================================
const updateStakingPackages = async (req, res) => {
    try {
        const { package: pkg, settings } = req.body;
        
        let dbSettings = await Setting.findOne();
        if (!dbSettings) dbSettings = new Setting();

        // Package ke hisaab se update
        if (pkg === 'BASIC') {
            dbSettings.basicMinAmount = settings.minAmount;
            dbSettings.basicRoiMin = settings.roiMin;
            dbSettings.basicRoiMax = settings.roiMax;
            dbSettings.basicReferralBonus = settings.referralBonus;
            dbSettings.basicPeriod = settings.period;
        } else if (pkg === 'PRO') {
            dbSettings.proMinAmount = settings.minAmount;
            dbSettings.proRoiMin = settings.roiMin;
            dbSettings.proRoiMax = settings.roiMax;
            dbSettings.proReferralBonus = settings.referralBonus;
            dbSettings.proPeriod = settings.period;
        } else if (pkg === 'ELITE') {
            dbSettings.eliteMinAmount = settings.minAmount;
            dbSettings.eliteRoiMin = settings.roiMin;
            dbSettings.eliteRoiMax = settings.roiMax;
            dbSettings.eliteReferralBonus = settings.referralBonus;
            dbSettings.elitePeriod = settings.period;
            dbSettings.eliteSpecialBonusEnabled = settings.specialBonusEnabled;
            dbSettings.eliteSpecialBonusAmount = settings.specialBonusAmount;
            dbSettings.eliteSpecialBonusThreshold = settings.specialBonusThreshold;
        }

        dbSettings.updatedBy = req.admin.username;
        await dbSettings.save();

        res.json({
            success: true,
            message: `${pkg} package updated successfully`
        });

    } catch (error) {
        console.error('Update package error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE TRADING BOT SETTINGS
// ============================================
const updateBotSettings = async (req, res) => {
    try {
        const { startHour, endHour, enabled, closedSunday } = req.body;
        
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();

        if (startHour !== undefined) settings.botTradingStartHour = startHour;
        if (endHour !== undefined) settings.botTradingEndHour = endHour;
        if (enabled !== undefined) settings.botEnabled = enabled;
        if (closedSunday !== undefined) settings.botClosedSunday = closedSunday;

        settings.updatedBy = req.admin.username;
        await settings.save();

        res.json({
            success: true,
            message: 'Bot settings updated successfully'
        });

    } catch (error) {
        console.error('Update bot error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE WITHDRAWAL SETTINGS
// ============================================
const updateWithdrawalSettings = async (req, res) => {
    try {
        const { feePercent, minAmount, maxAmount } = req.body;
        
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();

        if (feePercent !== undefined) settings.withdrawalFeePercent = feePercent;
        if (minAmount !== undefined) settings.minWithdrawal = minAmount;
        if (maxAmount !== undefined) settings.maxWithdrawal = maxAmount;

        settings.updatedBy = req.admin.username;
        await settings.save();

        res.json({
            success: true,
            message: 'Withdrawal settings updated successfully'
        });

    } catch (error) {
        console.error('Update withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE LEVEL INCOME PERCENTAGES
// ============================================
const updateLevelPercentages = async (req, res) => {
    try {
        const { level1, level2, level3, level4, level5 } = req.body;
        
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();

        if (level1 !== undefined) settings.level1Percent = level1;
        if (level2 !== undefined) settings.level2Percent = level2;
        if (level3 !== undefined) settings.level3Percent = level3;
        if (level4 !== undefined) settings.level4Percent = level4;
        if (level5 !== undefined) settings.level5Percent = level5;

        settings.updatedBy = req.admin.username;
        await settings.save();

        res.json({
            success: true,
            message: 'Level percentages updated successfully'
        });

    } catch (error) {
        console.error('Update levels error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE MAINTENANCE MODE
// ============================================
const toggleMaintenance = async (req, res) => {
    try {
        const { mode } = req.body;
        
        let settings = await Setting.findOne();
        if (!settings) settings = new Setting();

        settings.maintenanceMode = mode;
        settings.updatedBy = req.admin.username;
        await settings.save();

        res.json({
            success: true,
            message: `Maintenance mode ${mode ? 'enabled' : 'disabled'}`
        });

    } catch (error) {
        console.error('Toggle maintenance error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    updateStakingPackages,
    updateBotSettings,
    updateWithdrawalSettings,
    updateLevelPercentages,
    toggleMaintenance
};