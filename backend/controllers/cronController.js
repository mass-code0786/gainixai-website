const cron = require('node-cron');
const Staking = require('../models/staking');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const LevelIncome = require('../models/levelIncome');
const BotSettings = require('../models/BotSetting');

// ============================================
// DAILY ROI DISTRIBUTION
// ============================================
const distributeDailyROI = async () => {
    console.log('🔄 Running daily ROI distribution...');
    
    try {
        const activeStakings = await Staking.find({ status: 'ACTIVE' });
        let totalDistributed = 0;

        for (const staking of activeStakings) {
            // Calculate daily ROI
            const roiAmount = staking.dailyROI;
            
            // Get user
            const user = await User.findOne({ userId: staking.userId });
            if (!user) continue;
            
            // Add to withdraw wallet
            user.withdrawWallet += roiAmount;
            staking.totalROIEarned += roiAmount;
            staking.lastROITime = new Date();
            
            await user.save();
            await staking.save();
            
            totalDistributed += roiAmount;
            
            // Record transaction
            await Transaction.create({
                userId: user.userId,
                type: 'staking',
                amount: roiAmount,
                description: `Daily ROI from ${staking.package} staking`,
                createdAt: new Date()
            });
            
            // Schedule level income distribution after 10 minutes
            setTimeout(async () => {
                await distributeLevelIncome(user, staking, roiAmount);
            }, 10 * 60 * 1000); // 10 minutes
        }
        
        console.log(`✅ Daily ROI distribution completed: $${totalDistributed.toFixed(2)}`);
        
    } catch (error) {
        console.error('❌ ROI distribution error:', error);
    }
};

// ============================================
// LEVEL INCOME DISTRIBUTION
// ============================================
const distributeLevelIncome = async (user, staking, roiAmount) => {
    try {
        let currentUser = user;
        const percentages = { 1: 10, 2: 7, 3: 5, 4: 3, 5: 1 };
        let level = 1;
        
        while (level <= 5 && currentUser.sponsorId) {
            const upline = await User.findOne({ userId: currentUser.sponsorId });
            if (!upline) break;
            
            // Check if this level is unlocked (based on active referrals)
            if (upline.activeReferralCount >= level) {
                const levelAmount = (roiAmount * percentages[level]) / 100;
                
                if (levelAmount > 0) {
                    // Credit to upline's withdraw wallet
                    upline.withdrawWallet += levelAmount;
                    await upline.save();
                    
                    // Record level income
                    await LevelIncome.create({
                        userId: upline.userId,
                        fromUserId: user.userId,
                        level: level,
                        amount: levelAmount,
                        percentage: percentages[level],
                        sourceAmount: roiAmount,
                        sourceType: 'staking',
                        createdAt: new Date()
                    });
                    
                    // Record transaction
                    await Transaction.create({
                        userId: upline.userId,
                        type: 'level',
                        amount: levelAmount,
                        description: `Level ${level} income from ${user.userId}`,
                        createdAt: new Date()
                    });
                }
            }
            
            currentUser = upline;
            level++;
        }
        
    } catch (error) {
        console.error('Level income error:', error);
    }
};

// ============================================
// INITIALIZE CRON JOBS
// ============================================
const initCronJobs = () => {
    // Daily ROI at 10:00 AM UTC (after trading window closes)
    cron.schedule('0 10 * * *', distributeDailyROI);
    
    console.log('⏰ Cron jobs scheduled');
};

module.exports = {
    distributeDailyROI,
    distributeLevelIncome,
    initCronJobs
};