const User = require('../models/User');
const Staking = require('../models/Staking');

// Package configurations (same as staking controller)
const packages = {
    BASIC: { referralBonus: 5 },
    PRO: { referralBonus: 7 },
    ELITE: { referralBonus: 10 }
};

// @desc    Get referral summary
// @route   GET /api/referral/summary
// @access  Private
const getReferralSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId }).populate('directReferrals');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all downline users
        const downlines = user.directReferrals || [];
        
        // Get all stakings from downlines
        const downlineUserIds = downlines.map(ref => ref.userId);
        const downlineStakings = await Staking.find({
            userId: { $in: downlineUserIds },
            status: 'ACTIVE'
        });

        // Calculate earnings by package
        const earnings = {
            BASIC: 0,
            PRO: 0,
            ELITE: 0,
            total: 0
        };

        const packageDetails = [];

        downlineStakings.forEach(staking => {
            const pkg = packages[staking.package];
            if (pkg) {
                const referralAmount = (staking.amount * pkg.referralBonus) / 100;
                earnings[staking.package] += referralAmount;
                earnings.total += referralAmount;
                
                packageDetails.push({
                    package: staking.package,
                    amount: staking.amount,
                    referralBonus: pkg.referralBonus,
                    earned: referralAmount,
                    fromUser: staking.userId,
                    date: staking.createdAt
                });
            }
        });

        // Calculate total team volume
        const teamVolume = downlineStakings.reduce((sum, s) => sum + s.amount, 0);

        // Rank progress for each downline
        const downlineDetails = await Promise.all(downlines.map(async (ref) => {
            const refStakings = await Staking.find({ 
                userId: ref.userId,
                status: 'ACTIVE'
            });
            
            const totalStaked = refStakings.reduce((sum, s) => sum + s.amount, 0);
            const activePackages = refStakings.map(s => s.package);
            
            return {
                userId: ref.userId,
                name: ref.name,
                email: ref.email,
                joinDate: ref.createdAt,
                totalStaked: totalStaked,
                activePackages: activePackages,
                packageCount: refStakings.length,
                currentRank: ref.currentRank || 1,
                rankName: ref.rankName || '⭐ Rank 1'
            };
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalReferrals: user.directCount,
                    totalReferralEarned: earnings.total.toFixed(2),
                    totalTeamVolume: teamVolume,
                    qualifiedForRank: downlineDetails.filter(d => d.currentRank >= 2).length
                },
                earningsByPackage: {
                    BASIC: earnings.BASIC.toFixed(2),
                    PRO: earnings.PRO.toFixed(2),
                    ELITE: earnings.ELITE.toFixed(2)
                },
                recentCommissions: packageDetails.slice(0, 10).map(p => ({
                    package: p.package,
                    amount: p.amount,
                    bonus: p.referralBonus,
                    earned: p.earned.toFixed(2),
                    from: p.fromUser,
                    date: p.date
                })),
                downlines: downlineDetails,
                stats: {
                    activeDownlines: downlineDetails.filter(d => d.packageCount > 0).length,
                    totalPackages: downlineStakings.length,
                    averageStake: downlineStakings.length > 0 
                        ? (teamVolume / downlineStakings.length).toFixed(2) 
                        : 0
                }
            }
        });

    } catch (error) {
        console.error('❌ Referral Summary Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get downline list with details
// @route   GET /api/referral/downlines
// @access  Private
const getDownlines = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId }).populate('directReferrals');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const downlines = user.directReferrals || [];
        
        const downlineDetails = await Promise.all(downlines.map(async (ref) => {
            const stakings = await Staking.find({ userId: ref.userId });
            const activeStakings = stakings.filter(s => s.status === 'ACTIVE');
            
            const totalInvested = stakings.reduce((sum, s) => sum + s.amount, 0);
            const totalEarned = stakings.reduce((sum, s) => sum + s.totalROIEarned, 0);

            return {
                userId: ref.userId,
                name: ref.name,
                email: ref.email,
                phone: ref.phone,
                joinDate: ref.createdAt,
                status: 'active',
                rank: {
                    current: ref.currentRank || 1,
                    name: ref.rankName || '⭐ Rank 1'
                },
                business: {
                    totalInvested,
                    totalEarned,
                    activeStakings: activeStakings.length,
                    totalStakings: stakings.length
                },
                lastActive: ref.lastROITime || ref.createdAt
            };
        }));

        // Sort by join date (newest first)
        downlineDetails.sort((a, b) => b.joinDate - a.joinDate);

        res.status(200).json({
            success: true,
            count: downlineDetails.length,
            data: downlineDetails
        });

    } catch (error) {
        console.error('❌ Get Downlines Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get referral commission history
// @route   GET /api/referral/commissions
// @access  Private
const getCommissionHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all downlines
        const downlines = await User.find({ sponsorId: user.userId });
        const downlineIds = downlines.map(d => d.userId);

        // Get all stakings from downlines
        const stakings = await Staking.find({
            userId: { $in: downlineIds }
        }).sort({ createdAt: -1 }).limit(50);

        const commissions = stakings.map(staking => {
            const pkg = packages[staking.package];
            const referralAmount = (staking.amount * pkg.referralBonus) / 100;
            
            return {
                id: staking._id,
                date: staking.createdAt,
                fromUser: staking.userId,
                package: staking.package,
                amount: staking.amount,
                referralBonus: pkg.referralBonus,
                commission: referralAmount,
                status: 'credited',
                type: 'staking_referral'
            };
        });

        res.status(200).json({
            success: true,
            count: commissions.length,
            data: commissions
        });

    } catch (error) {
        console.error('❌ Commission History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get referral statistics
// @route   GET /api/referral/stats
// @access  Private
const getReferralStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all downlines
        const downlines = await User.find({ sponsorId: user.userId });
        
        // Get downlines with activity
        const activeDownlines = downlines.filter(d => d.totalStaked > 0);
        
        // Calculate levels (simplified - you can expand this)
        const level1Count = downlines.length;
        const level2Count = await User.countDocuments({ 
            sponsorId: { $in: downlines.map(d => d.userId) } 
        });

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalReferrals: user.directCount,
                    activeReferrals: activeDownlines.length,
                    level1: level1Count,
                    level2: level2Count,
                    totalTeam: level1Count + level2Count
                },
                performance: {
                    totalTeamVolume: downlines.reduce((sum, d) => sum + (d.totalStaked || 0), 0),
                    averageStake: downlines.length > 0 
                        ? (downlines.reduce((sum, d) => sum + (d.totalStaked || 0), 0) / downlines.length).toFixed(2)
                        : 0,
                    qualifiedForRank: downlines.filter(d => d.currentRank >= 2).length
                },
                ranks: {
                    rank1: downlines.filter(d => d.currentRank === 1).length,
                    rank2: downlines.filter(d => d.currentRank === 2).length,
                    rank3: downlines.filter(d => d.currentRank === 3).length,
                    rank4: downlines.filter(d => d.currentRank === 4).length,
                    rank5: downlines.filter(d => d.currentRank >= 5).length
                }
            }
        });

    } catch (error) {
        console.error('❌ Referral Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getReferralSummary,
    getDownlines,
    getCommissionHistory,
    getReferralStats
};