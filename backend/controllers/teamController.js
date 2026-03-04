const User = require('../models/User');
const Staking = require('../models/Staking');

// ============================================
// GET TEAM BY LEVEL - UNLIMITED DEPTH (ACTIVE ONLY)
// ============================================
const getTeamByLevel = async (req, res) => {
    try {
        const { level } = req.params;
        const userId = req.user.userId;
        const { active } = req.query;
        
        const levelNum = parseInt(level);
        if (levelNum < 1 || levelNum > 1000000) {
            return res.status(400).json({
                success: false,
                message: 'Level must be between 1 and 1,000,000'
            });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get downlines at specified level
        const downlines = await getDownlinesAtLevel(user, levelNum);
        
        const result = [];
        let totalVolume = 0;
        let activeCount = 0;

        for (const downline of downlines) {
            const stakings = await Staking.find({
                userId: downline.userId,
                status: 'ACTIVE'
            });
            
            const totalStaked = stakings.reduce((sum, s) => sum + s.amount, 0);
            const isActive = totalStaked > 0;
            
            if (isActive) totalVolume += totalStaked;
            if (isActive) activeCount++;
            
            if (active === 'true' && !isActive) continue;
            
            result.push({
                userId: downline.userId,
                name: downline.name,
                email: downline.email,
                joinDate: downline.createdAt,
                contribution: totalStaked,
                isActive: isActive,
                status: isActive ? 'active' : 'inactive',
                rank: downline.currentRank || 1,
                rankName: downline.rankName || '⭐ Rank 1'
            });
        }

        res.json({
            success: true,
            data: result,
            stats: {
                totalMembers: result.length,
                activeMembers: activeCount,
                totalVolume: totalVolume,
                level: levelNum
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// GET LEVEL 1-5 USERS (ALL - ACTIVE + INACTIVE)
// ============================================
const getLevel1To5 = async (req, res) => {
    try {
        const { level } = req.params;
        const userId = req.user.userId;
        
        const levelNum = parseInt(level);
        if (levelNum < 1 || levelNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Level must be between 1 and 5'
            });
        }

        const user = await User.findOne({ userId });
        
        const downlines = await getDownlinesAtLevel(user, levelNum);
        
        const result = [];
        let totalVolume = 0;
        let activeCount = 0;

        for (const downline of downlines) {
            const stakings = await Staking.find({
                userId: downline.userId,
                status: 'ACTIVE'
            });
            
            const totalStaked = stakings.reduce((sum, s) => sum + s.amount, 0);
            const isActive = totalStaked > 0;
            
            if (isActive) {
                totalVolume += totalStaked;
                activeCount++;
            }
            
            result.push({
                userId: downline.userId,
                name: downline.name,
                email: downline.email,
                joinDate: downline.createdAt,
                contribution: totalStaked,
                isActive: isActive,
                status: isActive ? 'active' : 'inactive',
                rank: downline.currentRank || 1,
                rankName: downline.rankName || '⭐ Rank 1'
            });
        }

        res.json({
            success: true,
            data: result,
            stats: {
                totalMembers: result.length,
                activeMembers: activeCount,
                totalVolume: totalVolume,
                level: levelNum
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function
async function getDownlinesAtLevel(user, targetLevel) {
    let currentLevel = 1;
    let currentUsers = [user];
    let allDownlines = [];

    while (currentLevel <= targetLevel && currentUsers.length > 0) {
        let nextUsers = [];
        
        for (const u of currentUsers) {
            const referrals = await User.find({ sponsorId: u.userId });
            
            if (currentLevel === targetLevel) {
                allDownlines.push(...referrals);
            } else {
                nextUsers.push(...referrals);
            }
        }
        
        currentUsers = nextUsers;
        currentLevel++;
    }

    return allDownlines;
}

module.exports = {
    getTeamByLevel,
    getLevel1To5
};