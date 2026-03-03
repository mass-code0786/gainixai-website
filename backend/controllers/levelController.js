const User = require('../models/User');
const Staking = require('../models/Staking');
const LevelIncome = require('../models/LevelIncome');

// Level percentages (as per your plan)
const LEVEL_PERCENTAGES = {
    1: 10, // Level 1: 10% of team's ROI
    2: 7,  // Level 2: 7% of team's ROI
    3: 5,  // Level 3: 5% of team's ROI
    4: 3,  // Level 4: 3% of team's ROI
    5: 1   // Level 5: 1% of team's ROI
};

// Level unlock rules (based on direct referrals)
const getMaxUnlockedLevel = (directCount) => {
    if (directCount >= 5) return 5;
    if (directCount >= 4) return 4;
    if (directCount >= 3) return 3;
    if (directCount >= 2) return 2;
    if (directCount >= 1) return 1;
    return 0; // No level unlocked
};

// @desc    Get team members at each level
// @route   GET /api/level/team/:level
// @access  Private
const getTeamByLevel = async (req, res) => {
    try {
        const { level } = req.params;
        const userId = req.user.userId;

        if (level < 1 || level > 5) {
            return res.status(400).json({
                success: false,
                message: 'Level must be between 1 and 5'
            });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if level is unlocked
        const maxUnlockedLevel = getMaxUnlockedLevel(user.directCount);
        if (level > maxUnlockedLevel) {
            return res.status(403).json({
                success: false,
                message: `Level ${level} is locked. You need ${level} direct referrals to unlock.`,
                currentDirects: user.directCount,
                requiredDirects: level,
                unlockedLevels: maxUnlockedLevel
            });
        }

        // Get team members for this level (you'll need to implement the MLM tree logic)
        // For now, returning mock data
        const teamMembers = await getTeamMembersAtLevel(user._id, level);

        res.status(200).json({
            success: true,
            level: level,
            unlocked: true,
            totalMembers: teamMembers.length,
            data: teamMembers
        });

    } catch (error) {
        console.error('Get Team Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to get team members (implement actual MLM logic)
async function getTeamMembersAtLevel(userId, level) {
    // This is where you implement the actual MLM tree traversal
    // For now, returning mock data
    const mockMembers = [];
    for (let i = 1; i <= Math.floor(Math.random() * 5) + 1; i++) {
        mockMembers.push({
            userId: `Gainix${100000 + i}`,
            name: `Team Member ${i}`,
            joinDate: new Date(),
            contribution: Math.floor(Math.random() * 1000) + 100
        });
    }
    return mockMembers;
}

// @desc    Get level income summary
// @route   GET /api/level/summary
// @access  Private
const getLevelIncomeSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });

        const maxUnlockedLevel = getMaxUnlockedLevel(user.directCount);

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
                unlockedStatus: isUnlocked ? 'Active' : `Locked (need ${level} direct)`,
                requiredDirects: level,
                currentDirects: user.directCount,
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
            directCount: user.directCount,
            levels: levelStats
        });

    } catch (error) {
        console.error('Level Summary Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get level income history
// @route   GET /api/level/history
// @access  Private
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
        console.error('Level History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Calculate and distribute level income (called by cron job)
// @route   POST /api/level/distribute (admin only)
// @access  Private/Admin
const distributeLevelIncome = async (req, res) => {
    try {
        // This would be called by a cron job daily
        // For now, just a placeholder
        res.status(200).json({
            success: true,
            message: 'Level income distribution triggered'
        });
    } catch (error) {
        console.error('Distribution Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getTeamByLevel,
    getLevelIncomeSummary,
    getLevelIncomeHistory,
    distributeLevelIncome
};