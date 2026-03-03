const User = require('../models/User');
const SalaryRank = require('../models/SalaryRank');

// @desc    Get all salary ranks
// @route   GET /api/salary/ranks
// @access  Public
const getAllRanks = async (req, res) => {
    try {
        const ranks = SalaryRank.getRanks();
        
        res.status(200).json({
            success: true,
            data: ranks
        });
    } catch (error) {
        console.error('Get Ranks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get user's current rank and progress
// @route   GET /api/salary/my-rank
// @access  Private
const getMyRank = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const ranks = SalaryRank.getRanks();
        const currentRank = ranks[user.currentRank - 1] || ranks[0];
        const nextRank = ranks[user.currentRank] || null;

        // Calculate progress to next rank
        let progress = {
            directVolume: {
                current: user.directBusiness || 0,
                required: nextRank ? nextRank.directVolume : null,
                percentage: nextRank ? Math.min(100, ((user.directBusiness || 0) / nextRank.directVolume) * 100) : 100
            },
            teamVolume: {
                current: user.teamBusiness || 0,
                required: nextRank ? nextRank.teamVolume : null,
                percentage: nextRank ? Math.min(100, ((user.teamBusiness || 0) / nextRank.teamVolume) * 100) : 100
            },
            qualifiedMembers: {
                current: user.rankQualifiedMembers || 0,
                required: nextRank ? 2 : null,
                percentage: nextRank ? Math.min(100, ((user.rankQualifiedMembers || 0) / 2) * 100) : 100
            }
        };

        // Check if today is Sunday - no salary info
        const today = new Date();
        const isSunday = today.getUTCDay() === 0;

        res.status(200).json({
            success: true,
            isSunday,
            message: isSunday ? 'Sunday - Bot Closed. No salary/income generated today.' : undefined,
            data: {
                currentRank: {
                    rank: currentRank.rank,
                    stars: currentRank.stars,
                    directVolume: currentRank.directVolume,
                    teamVolume: currentRank.teamVolume,
                    requirement: currentRank.requirement,
                    weeklySalary: currentRank.weeklySalary
                },
                nextRank: nextRank ? {
                    rank: nextRank.rank,
                    stars: nextRank.stars,
                    directVolume: nextRank.directVolume,
                    teamVolume: nextRank.teamVolume,
                    requirement: nextRank.requirement,
                    weeklySalary: nextRank.weeklySalary
                } : null,
                progress,
                totalSalaryEarned: user.totalSalaryEarned || 0,
                lastSalaryPaid: user.lastSalaryPaid
            }
        });

    } catch (error) {
        console.error('Get My Rank Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Check rank eligibility
// @route   POST /api/salary/check-rank
// @access  Private
const checkRankEligibility = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId }).populate('directReferrals');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if today is Sunday
        const today = new Date();
        if (today.getUTCDay() === 0) {
            return res.status(400).json({
                success: false,
                message: 'Sunday - Bot Closed. Rank checks not available.'
            });
        }

        const ranks = SalaryRank.getRanks();
        let currentRank = user.currentRank || 1;
        let rankChanged = false;
        let checkedRanks = [];

        // Check each rank from current to next
        for (let i = currentRank - 1; i < ranks.length; i++) {
            const targetRank = ranks[i];
            
            const rankCheck = {
                rank: targetRank.rank,
                stars: targetRank.stars,
                requirements: {
                    directVolume: {
                        required: targetRank.directVolume,
                        current: user.directBusiness || 0,
                        met: (user.directBusiness || 0) >= targetRank.directVolume
                    },
                    teamVolume: {
                        required: targetRank.teamVolume,
                        current: user.teamBusiness || 0,
                        met: (user.teamBusiness || 0) >= targetRank.teamVolume
                    }
                }
            };

            // Check direct volume
            if ((user.directBusiness || 0) < targetRank.directVolume) {
                rankCheck.status = 'failed';
                rankCheck.reason = 'Insufficient direct volume';
                checkedRanks.push(rankCheck);
                break;
            }
            
            // Check team volume
            if ((user.teamBusiness || 0) < targetRank.teamVolume) {
                rankCheck.status = 'failed';
                rankCheck.reason = 'Insufficient team volume';
                checkedRanks.push(rankCheck);
                break;
            }
            
            // Check qualified members requirement (except rank 1)
            if (targetRank.rank > 1) {
                // Count how many direct referrals have reached previous rank
                const qualifiedCount = await User.countDocuments({
                    _id: { $in: user.directReferrals },
                    currentRank: { $gte: targetRank.rank - 1 }
                });
                
                rankCheck.requirements.qualifiedMembers = {
                    required: 2,
                    current: qualifiedCount,
                    met: qualifiedCount >= 2
                };

                if (qualifiedCount < 2) {
                    rankCheck.status = 'failed';
                    rankCheck.reason = 'Need 2 qualified members at previous rank';
                    checkedRanks.push(rankCheck);
                    break;
                }
                
                user.rankQualifiedMembers = qualifiedCount;
            }
            
            // All requirements met
            rankCheck.status = 'eligible';
            checkedRanks.push(rankCheck);
            
            // Update to next rank
            if (targetRank.rank > currentRank) {
                currentRank = targetRank.rank;
                rankChanged = true;
            }
        }

        if (rankChanged) {
            user.currentRank = currentRank;
            user.rankName = ranks[currentRank - 1].stars + ' Rank ' + currentRank;
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: rankChanged ? '🎉 Congratulations! Rank upgraded!' : 'Rank check completed',
            rankChanged,
            currentRank: {
                rank: user.currentRank,
                stars: ranks[user.currentRank - 1].stars,
                weeklySalary: ranks[user.currentRank - 1].weeklySalary
            },
            checkedRanks
        });

    } catch (error) {
        console.error('Check Rank Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Distribute weekly salary (every Saturday at 12:00 AM UTC)
// @route   POST /api/salary/distribute
// @access  Private/Admin
const distributeWeeklySalary = async (req, res) => {
    try {
        const today = new Date();
        
        // Check if today is Saturday (6)
        if (today.getUTCDay() !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Salary can only be distributed on Saturday at 12:00 AM UTC'
            });
        }

        // Check if it's exactly 12:00 AM UTC or within first hour
        const hours = today.getUTCHours();
        if (hours !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Salary distribution only runs at 12:00 AM UTC'
            });
        }

        const ranks = SalaryRank.getRanks();
        const allUsers = await User.find({});
        let distributedCount = 0;
        let totalDistributed = 0;
        let distributionLog = [];

        for (const user of allUsers) {
            // Check if already paid this week
            const lastPaid = user.lastSalaryPaid;
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            if (lastPaid && lastPaid > oneWeekAgo) {
                continue; // Already paid this week
            }

            // Get user's rank salary
            const userRank = ranks[user.currentRank - 1];
            if (!userRank) continue;

            // Verify user still meets rank requirements
            const stillQualified = await verifyRankQualification(user, userRank.rank);
            
            if (!stillQualified) {
                distributionLog.push({
                    userId: user.userId,
                    rank: user.currentRank,
                    status: 'skipped',
                    reason: 'No longer meets rank requirements'
                });
                continue;
            }

            // Credit salary to withdraw wallet
            const salary = userRank.weeklySalary;
            user.withdrawWallet += salary;
            user.totalSalaryEarned = (user.totalSalaryEarned || 0) + salary;
            user.lastSalaryPaid = today;
            
            await user.save();
            
            distributedCount++;
            totalDistributed += salary;
            
            distributionLog.push({
                userId: user.userId,
                rank: user.currentRank,
                salary,
                status: 'paid'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Weekly salary distributed successfully',
            data: {
                distributionDate: today,
                qualifiedAchievers: distributedCount,
                totalDistributed,
                distributionLog
            }
        });

    } catch (error) {
        console.error('Salary Distribution Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to verify rank qualification
async function verifyRankQualification(user, rank) {
    const ranks = SalaryRank.getRanks();
    const targetRank = ranks[rank - 1];
    
    if (!targetRank) return false;
    
    // Check direct volume
    if ((user.directBusiness || 0) < targetRank.directVolume) {
        return false;
    }
    
    // Check team volume
    if ((user.teamBusiness || 0) < targetRank.teamVolume) {
        return false;
    }
    
    // For ranks above 1, check qualified members
    if (rank > 1) {
        const qualifiedCount = await User.countDocuments({
            _id: { $in: user.directReferrals },
            currentRank: { $gte: rank - 1 }
        });
        
        if (qualifiedCount < 2) {
            return false;
        }
    }
    
    return true;
}

// @desc    Get salary history
// @route   GET /api/salary/history
// @access  Private
const getSalaryHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });
        
        // You can create a SalaryTransaction model for detailed history
        res.status(200).json({
            success: true,
            data: {
                totalSalaryEarned: user.totalSalaryEarned || 0,
                lastSalaryPaid: user.lastSalaryPaid,
                currentRank: user.currentRank,
                currentRankStars: user.rankName,
                weeklySalary: user.currentRank ? SalaryRank.getRanks()[user.currentRank - 1]?.weeklySalary : 0
            }
        });
    } catch (error) {
        console.error('Salary History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getAllRanks,
    getMyRank,
    checkRankEligibility,
    distributeWeeklySalary,
    getSalaryHistory
};