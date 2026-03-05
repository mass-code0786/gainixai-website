const BotSettings = require('../models/BotSettings');

// ============================================
// GET BOT SETTINGS
// ============================================
const getBotSettings = async (req, res) => {
    try {
        let settings = await BotSettings.findOne();
        
        if (!settings) {
            settings = await BotSettings.create({});
        }

        res.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('Get bot settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE BOT SETTINGS
// ============================================
const updateBotSettings = async (req, res) => {
    try {
        const {
            tradingStartHour,
            tradingEndHour,
            tradeDurationMinutes,
            stakingIncomeDelayMinutes,
            levelIncomeDelayMinutes,
            winProbability
        } = req.body;

        let settings = await BotSettings.findOne();
        if (!settings) {
            settings = new BotSettings();
        }

        if (tradingStartHour !== undefined) settings.tradingStartHour = tradingStartHour;
        if (tradingEndHour !== undefined) settings.tradingEndHour = tradingEndHour;
        if (tradeDurationMinutes !== undefined) settings.tradeDurationMinutes = tradeDurationMinutes;
        if (stakingIncomeDelayMinutes !== undefined) settings.stakingIncomeDelayMinutes = stakingIncomeDelayMinutes;
        if (levelIncomeDelayMinutes !== undefined) settings.levelIncomeDelayMinutes = levelIncomeDelayMinutes;
        if (winProbability !== undefined) settings.winProbability = winProbability;

        settings.updatedBy = req.admin?.username || 'admin';
        settings.updatedAt = new Date();
        await settings.save();

        res.json({
            success: true,
            message: '✅ Bot settings updated successfully',
            data: settings
        });

    } catch (error) {
        console.error('Update bot settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// RESET BOT STATS
// ============================================
const resetBotStats = async (req, res) => {
    try {
        let settings = await BotSettings.findOne();
        if (!settings) {
            settings = new BotSettings();
        }

        settings.totalTrades = 0;
        settings.winRate = 0;
        settings.totalProfit = 0;
        await settings.save();

        res.json({
            success: true,
            message: '✅ Bot stats reset successfully',
            data: settings
        });

    } catch (error) {
        console.error('Reset bot stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET BOT STATS
// ============================================
const getBotStats = async (req, res) => {
    try {
        let settings = await BotSettings.findOne();
        
        if (!settings) {
            settings = await BotSettings.create({});
        }

        res.json({
            success: true,
            data: {
                totalTrades: settings.totalTrades,
                winRate: settings.winRate,
                totalProfit: settings.totalProfit
            }
        });

    } catch (error) {
        console.error('Get bot stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getBotSettings,
    updateBotSettings,
    resetBotStats,
    getBotStats
};