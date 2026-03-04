const User = require('../models/User');
const Staking = require('../models/staking');
const LevelIncome = require('../models/levelIncome');

// Level percentages
const LEVEL_PERCENTAGES = {
    1: 10,
    2: 7,
    3: 5,
    4: 3,
    5: 1
};

// ============================================
// GET MAX UNLOCKED LEVEL (Based on ACTIVE referrals)
// ============================================
const getMaxUnlockedLevel = (activeReferralCount) => {
    if (activeReferralCount >= 5) return 5;
    if (activeReferralCount >= 4) return 4;
    if (activeReferralCount >= 3) return 3;
    if (activeReferralCount >= 2) return 2;
    if (activeReferralCount >= 1) return 1;
    return 0;
};

// ============================================
// GET LEVEL INCOME SUMMARY
// ============================================
const getLevelIncomeSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const maxUnlockedLevel = getMaxUnlockedLevel(user.activeReferralCount || 0);

        // Get level income statistics
        const levelStats = [];
        let totalLevelIncome = 0;

        for (let level = 1; level <= 5; level++) {
            const isUnlocked = level <= maxUnlockedLevel;
            
            // Get actual income from database
            const income = await LevelIncome.aggregate([
                {
                    $match: {
                        userId: userId,
                        level: level
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                        today: {
                            $sum: {
                                $cond: [
                                    { $gte: ["$createdAt", new Date(new Date().setHours(0,0,0,0))] },
                                    "$amount",
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            const stats = {
                level,
                percentage: LEVEL_PERCENTAGES[level],
                isUnlocked,
                unlockedStatus: isUnlocked ? 'Active' : `Locked (need ${level} active referral${level > 1 ? 's' : ''} with staking)`,
                requiredActiveReferrals: level,
                currentActiveReferrals: user.activeReferralCount || 0,
                totalEarned: income.length > 0 ? income[0].total.toFixed(2) : '0.00',
                todayEarned: income.length > 0 ? income[0].today.toFixed(2) : '0.00',
                transactions: income.length > 0 ? income[0].count : 0
            };

            totalLevelIncome += income.length > 0 ? income[0].total : 0;
            levelStats.push(stats);
        }

        res.status(200).json({
            success: true,
            totalLevelIncome: totalLevelIncome.toFixed(2),
            todayLevelIncome: levelStats.reduce((sum, stat) => sum + parseFloat(stat.todayEarned), 0).toFixed(2),
            maxUnlockedLevel,
            activeReferralCount: user.activeReferralCount || 0,
            directCount: user.directCount || 0,
            levels: levelStats
        });

    } catch (error) {
        console.error('❌ Level Summary Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET TEAM BY LEVEL (For team structure)
// ============================================
const getTeamByLevel = async (req, res) => {
    try {
        const { level } = req.params;
        const userId = req.user.userId;
        const { active } = req.query; // 'true' for active only
        
        const levelNum = parseInt(level);
        if (levelNum < 1 || levelNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Level must be between 1 and 5 for income'
            });
        }

        const user = await User.findOne({ userId });
        
        // Get downlines at this level
        let downlines = [];
        let currentLevel = 1;
        let currentUsers = [user];

        while (currentLevel <= levelNum && currentUsers.length > 0) {
            let nextUsers = [];
            
            for (const u of currentUsers) {
                const referrals = await User.find({ sponsorId: u.userId });
                
                if (currentLevel === levelNum) {
                    // This is our target level
                    for (const ref of referrals) {
                        const stakings = await Staking.find({ 
                            userId: ref.userId,
                            status: 'ACTIVE'
                        });
                        
                        const totalStaked = stakings.reduce((sum, s) => sum + s.amount, 0);
                        const isActive = totalStaked > 0;
                        
                        // Apply active filter if requested
                        if (active === 'true' && !isActive) continue;
                        
                        downlines.push({
                            userId: ref.userId,
                            name: ref.name,
                            email: ref.email,
                            joinDate: ref.createdAt,
                            contribution: totalStaked,
                            isActive: isActive,
                            status: isActive ? 'active' : 'inactive',
                            rank: ref.currentRank || 1,
                            rankName: ref.rankName || '⭐ Rank 1'
                        });
                    }
                } else {
                    // Add to queue for next level
                    nextUsers.push(...referrals);
                }
            }
            
            currentUsers = nextUsers;
            currentLevel++;
        }

        res.json({
            success: true,
            data: downlines,
            level: levelNum,
            totalCount: downlines.length,
            activeCount: downlines.filter(d => d.isActive).length
        });

    } catch (error) {
        console.error('Error in getTeamByLevel:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET LEVEL INCOME HISTORY
// ============================================
const getLevelIncomeHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { level, page = 1, limit = 20 } = req.query;

        const query = { userId };
        if (level) {
            query.level = parseInt(level);
        }

        const history = await LevelIncome.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('fromUser', 'name userId');

        const total = await LevelIncome.countDocuments(query);

        res.status(200).json({
            success: true,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            data: history.map(h => ({
                id: h._id,
                level: h.level,
                amount: h.amount.toFixed(2),
                percentage: h.percentage,
                fromUser: h.fromUserId,
                fromName: h.fromUser?.name || 'Unknown',
                sourceAmount: h.sourceAmount,
                sourceType: h.sourceType,
                date: h.createdAt
            }))
        });

    } catch (error) {
        console.error('❌ Level History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// DISTRIBUTE LEVEL INCOME (Cron Job)
// ============================================
const distributeLevelIncome = async (req, res) => {
    try {
        // This would be called by a cron job daily
        // For now, just a placeholder
        res.status(200).json({
            success: true,
            message: 'Level income distribution triggered'
        });
    } catch (error) {
        console.error('❌ Distribution Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getLevelIncomeSummary,
    getTeamByLevel,
    getLevelIncomeHistory,
    distributeLevelIncome
};