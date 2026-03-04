const Staking = require('../models/staking');
const User = require('../models/User');
const LevelIncome = require('../models/levelIncome');

// Package configurations with referral bonuses
const packages = {
    BASIC: {
        minAmount: 20,
        period: 90,
        roiMin: 1.0,
        roiMax: 1.3,
        referralBonus: 5,        // 5% referral reward
        specialBonus: null
    },
    PRO: {
        minAmount: 150,
        period: 180,
        roiMin: 1.3,
        roiMax: 1.6,
        referralBonus: 7,        // 7% referral reward
        specialBonus: null
    },
    ELITE: {
        minAmount: 300,
        period: 450,
        roiMin: 1.5,
        roiMax: 2.0,
        referralBonus: 10,       // 10% referral reward
        specialBonus: { amount: 500, bonus: 100 } // $100 bonus on $500+
    }
};

// ============================================
// CREATE STAKING - WITH ACTIVE REFERRAL UPDATE
// ============================================
const createStaking = async (req, res) => {
    try {
        const { package: packageName, amount } = req.body;
        const userId = req.user.userId;

        console.log('📦 Create staking attempt:', { packageName, amount, userId });

        // Validate package
        if (!packages[packageName]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid package selected'
            });
        }

        const pkg = packages[packageName];

        // Validate amount
        if (amount < pkg.minAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum amount for ${packageName} is $${pkg.minAmount}`
            });
        }

        // Get user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if this is user's FIRST staking
        const existingStakings = await Staking.find({ userId: user.userId });
        const isFirstStaking = existingStakings.length === 0;

        console.log('👤 User found:', { 
            email: user.email, 
            fundWallet: user.fundWallet,
            sponsorId: user.sponsorId,
            isFirstStaking
        });

        // Check fund wallet balance
        if (user.fundWallet < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in Fund wallet',
                currentBalance: user.fundWallet,
                requiredAmount: amount
            });
        }

        // Calculate random daily ROI percentage between min and max
        const dailyPercentage = (Math.random() * (pkg.roiMax - pkg.roiMin) + pkg.roiMin).toFixed(2);
        const dailyROI = (amount * dailyPercentage) / 100;

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + pkg.period);

        console.log('📅 Staking period:', {
            start: startDate,
            end: endDate,
            days: pkg.period
        });

        // Create staking record
        const staking = await Staking.create({
            user: user._id,
            userId: user.userId,
            package: packageName,
            amount,
            dailyROI,
            dailyPercentage,
            startDate,
            endDate,
            period: pkg.period,
            status: 'ACTIVE',
            lastROITime: startDate,
            totalROIEarned: 0
        });

        console.log('✅ Staking created:', staking._id);

        // Deduct from fund wallet
        user.fundWallet -= amount;
        user.totalStaked = (user.totalStaked || 0) + amount;
        await user.save();

        console.log('💰 User wallet updated:', {
            newFundWallet: user.fundWallet,
            newTotalStaked: user.totalStaked
        });

        // ============================================
        // 🔥 DIRECT REFERRAL REWARD (PACKAGE WISE)
        // ============================================
        let referralMessage = '';
        let referralAmount = 0;
        let sponsorInfo = null;

        // Check if user has a sponsor
        if (user.sponsorId) {
            console.log('👥 Sponsor found:', user.sponsorId);
            
            const sponsor = await User.findOne({ userId: user.sponsorId });
            
            if (sponsor) {
                // Calculate referral bonus based on package
                const referralPercentage = pkg.referralBonus;
                referralAmount = (amount * referralPercentage) / 100;
                
                console.log(`💵 Referral calculation: $${amount} × ${referralPercentage}% = $${referralAmount}`);
                
                // Credit to sponsor's withdraw wallet
                sponsor.withdrawWallet = (sponsor.withdrawWallet || 0) + referralAmount;
                
                // Update sponsor's direct business
                sponsor.directBusiness = (sponsor.directBusiness || 0) + amount;
                
                // Update sponsor's team business (for all levels)
                sponsor.teamBusiness = (sponsor.teamBusiness || 0) + amount;
                
                // Update sponsor's direct referrals list (if not already)
                if (!sponsor.directReferrals.includes(user._id)) {
                    sponsor.directReferrals.push(user._id);
                    sponsor.directCount = sponsor.directReferrals.length;
                }
                
                // ============================================
                // 🔥 ACTIVE REFERRAL CHECK - CRITICAL PART
                // ============================================
                // ✅ Check if this downline is becoming active for the FIRST TIME
                if (isFirstStaking) {
                    // Check if not already in active referrals
                    if (!sponsor.activeReferrals.includes(user._id)) {
                        sponsor.activeReferrals.push(user._id);
                        sponsor.activeReferralCount = sponsor.activeReferrals.length;
                        
                        console.log(`✅ New ACTIVE referral added for ${sponsor.userId}: ${user.userId}`);
                        console.log(`📊 Sponsor now has ${sponsor.activeReferralCount} active referrals`);
                        
                        // 🔥 RECALCULATE UNLOCKED LEVELS FOR SPONSOR
                        await updateUnlockedLevels(sponsor);
                    }
                }
                
                await sponsor.save();
                
                referralMessage = ` + $${referralAmount.toFixed(2)} referral bonus credited to sponsor (${referralPercentage}%)`;
                
                sponsorInfo = {
                    sponsorId: sponsor.userId,
                    amount: referralAmount,
                    percentage: referralPercentage,
                    isNewActiveReferral: isFirstStaking && !sponsor.activeReferrals.includes(user._id)
                };
                
                console.log(`💰 Referral bonus: $${referralAmount} (${referralPercentage}%) credited to ${sponsor.userId}`);
                
                // ============================================
                // 🔥 UPDATE UPLINE TEAM BUSINESS (LEVELS 2-5)
                // ============================================
                await updateUplineTeamBusiness(sponsor, amount, 2);
                
                // ============================================
                // 🔥 DISTRIBUTE LEVEL INCOME TO UPLINES
                // ============================================
                await distributeLevelIncomeToUplines(sponsor, amount, user, 1);
            } else {
                console.log('⚠️ Sponsor not found in database:', user.sponsorId);
            }
        } else {
            console.log('👤 No sponsor for this user');
        }

        // ============================================
        // 🔥 ELITE SPECIAL BONUS
        // ============================================
        let bonusMessage = '';
        let specialBonusAmount = 0;

        if (packageName === 'ELITE' && amount >= 500) {
            specialBonusAmount = 100;
            user.fundWallet += specialBonusAmount;
            bonusMessage = ' + $100 instant bonus credited!';
            await user.save();
            console.log('🎁 ELITE special bonus: $100 credited');
        }

        // ============================================
        // ✅ SUCCESS RESPONSE
        // ============================================
        res.status(201).json({
            success: true,
            message: `✅ Staking created successfully!${referralMessage}${bonusMessage}`,
            data: {
                staking: {
                    id: staking._id,
                    package: staking.package,
                    amount: staking.amount,
                    dailyROI: staking.dailyROI.toFixed(2),
                    dailyPercentage: staking.dailyPercentage,
                    startDate: staking.startDate,
                    endDate: staking.endDate,
                    period: staking.period,
                    daysLeft: Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
                },
                wallet: {
                    fundWallet: user.fundWallet,
                    withdrawWallet: user.withdrawWallet,
                    totalStaked: user.totalStaked
                },
                referral: {
                    hasSponsor: !!user.sponsorId,
                    sponsorId: user.sponsorId,
                    bonusPercentage: pkg.referralBonus,
                    bonusEarned: referralAmount,
                    sponsorInfo: sponsorInfo
                },
                activeReferral: {
                    isFirstStaking,
                    isNewActiveReferral: isFirstStaking && sponsorInfo?.isNewActiveReferral,
                    sponsorActiveCount: sponsorInfo?.sponsorId ? (await User.findOne({ userId: sponsorInfo.sponsorId }))?.activeReferralCount : 0
                },
                specialBonus: specialBonusAmount
            }
        });

    } catch (error) {
        console.error('❌ Create Staking Error:', error);
        
        // Mongoose validation error
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error while creating staking',
            error: error.message
        });
    }
};

// ============================================
// 🔥 HELPER: Update Unlocked Levels Based on Active Referrals
// ============================================
async function updateUnlockedLevels(user) {
    // Level unlock rules based on ACTIVE referrals
    const activeCount = user.activeReferralCount || 0;
    
    let unlockedLevels = 0;
    if (activeCount >= 5) unlockedLevels = 5;
    else if (activeCount >= 4) unlockedLevels = 4;
    else if (activeCount >= 3) unlockedLevels = 3;
    else if (activeCount >= 2) unlockedLevels = 2;
    else if (activeCount >= 1) unlockedLevels = 1;
    else unlockedLevels = 0;
    
    if (user.unlockedLevels !== unlockedLevels) {
        user.unlockedLevels = unlockedLevels;
        await user.save();
        console.log(`📊 Unlocked levels updated for ${user.userId}: ${unlockedLevels} (based on ${activeCount} active referrals)`);
    }
    
    return unlockedLevels;
}

// ============================================
// 🔥 HELPER: Update Upline Team Business (Levels 2-5)
// ============================================
async function updateUplineTeamBusiness(user, amount, level) {
    if (level > 5 || !user.sponsorId) return;
    
    const upline = await User.findOne({ userId: user.sponsorId });
    if (upline) {
        upline.teamBusiness = (upline.teamBusiness || 0) + amount;
        await upline.save();
        
        console.log(`📈 Level ${level} team business updated for ${upline.userId}: +$${amount}`);
        
        // Recursively update next level upline
        await updateUplineTeamBusiness(upline, amount, level + 1);
    }
}

// ============================================
// 🔥 HELPER: Distribute Level Income to Uplines
// ============================================
async function distributeLevelIncomeToUplines(sponsor, amount, downlineUser, currentLevel) {
    if (currentLevel > 5 || !sponsor) return;
    
    try {
        // Check if this level is unlocked for sponsor
        const sponsorActiveCount = sponsor.activeReferralCount || 0;
        const isLevelUnlocked = sponsorActiveCount >= currentLevel;
        
        if (isLevelUnlocked) {
            // Calculate level income percentage
            let percentage = 0;
            switch(currentLevel) {
                case 1: percentage = 10; break;
                case 2: percentage = 7; break;
                case 3: percentage = 5; break;
                case 4: percentage = 3; break;
                case 5: percentage = 1; break;
            }
            
            const levelIncomeAmount = (amount * percentage) / 100;
            
            // Create level income record
            await LevelIncome.create({
                user: sponsor._id,
                userId: sponsor.userId,
                fromUser: downlineUser._id,
                fromUserId: downlineUser.userId,
                level: currentLevel,
                amount: levelIncomeAmount,
                percentage: percentage,
                sourceAmount: amount,
                sourceType: 'staking'
            });
            
            // Credit to sponsor's withdraw wallet
            sponsor.withdrawWallet = (sponsor.withdrawWallet || 0) + levelIncomeAmount;
            await sponsor.save();
            
            console.log(`📊 Level ${currentLevel} income: $${levelIncomeAmount} (${percentage}%) credited to ${sponsor.userId}`);
        }
        
        // Move to next level upline
        if (sponsor.sponsorId) {
            const nextUpline = await User.findOne({ userId: sponsor.sponsorId });
            if (nextUpline) {
                await distributeLevelIncomeToUplines(nextUpline, amount, downlineUser, currentLevel + 1);
            }
        }
    } catch (error) {
        console.error(`❌ Error distributing level ${currentLevel} income:`, error);
    }
}

// ============================================
// GET USER'S ACTIVE STAKINGS
// ============================================
const getActiveStakings = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const stakings = await Staking.find({ 
            userId, 
            status: 'ACTIVE' 
        }).sort({ startDate: -1 });

        const now = new Date();

        res.status(200).json({
            success: true,
            count: stakings.length,
            data: stakings.map(s => ({
                id: s._id,
                package: s.package,
                amount: s.amount,
                dailyROI: s.dailyROI.toFixed(2),
                dailyPercentage: s.dailyPercentage,
                startDate: s.startDate,
                endDate: s.endDate,
                period: s.period,
                totalROIEarned: s.totalROIEarned.toFixed(2),
                daysLeft: Math.max(0, Math.ceil((s.endDate - now) / (1000 * 60 * 60 * 24))),
                isCompleted: now >= s.endDate,
                status: s.status
            }))
        });

    } catch (error) {
        console.error('❌ Get Stakings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// UNSTAKE STAKING
// ============================================
const unstakeStaking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const staking = await Staking.findOne({ _id: id, userId });
        
        if (!staking) {
            return res.status(404).json({
                success: false,
                message: 'Staking not found'
            });
        }

        if (staking.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Staking is not active'
            });
        }

        // Check if staking period is completed
        const now = new Date();
        if (now < staking.endDate) {
            return res.status(400).json({
                success: false,
                message: `Staking is locked until ${staking.endDate.toLocaleDateString()}`,
                daysLeft: Math.ceil((staking.endDate - now) / (1000 * 60 * 60 * 24))
            });
        }

        // Update staking status
        staking.status = 'COMPLETED';
        await staking.save();

        // Add amount to withdraw wallet
        const user = await User.findOne({ userId });
        user.withdrawWallet += staking.amount;
        user.totalStaked -= staking.amount;
        await user.save();

        res.status(200).json({
            success: true,
            message: '✅ Staking unstaked successfully',
            data: {
                stakingId: staking._id,
                package: staking.package,
                amount: staking.amount,
                newWithdrawBalance: user.withdrawWallet,
                newTotalStaked: user.totalStaked
            }
        });

    } catch (error) {
        console.error('❌ Unstake Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET STAKING STATISTICS
// ============================================
const getStakingStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });

        const stakings = await Staking.find({ userId, status: 'ACTIVE' });
        
        const totalStaked = stakings.reduce((sum, s) => sum + s.amount, 0);
        const totalDailyROI = stakings.reduce((sum, s) => sum + s.dailyROI, 0);
        const totalROIEarned = stakings.reduce((sum, s) => sum + s.totalROIEarned, 0);

        // Package-wise breakdown
        const packageBreakdown = {
            BASIC: stakings.filter(s => s.package === 'BASIC').length,
            PRO: stakings.filter(s => s.package === 'PRO').length,
            ELITE: stakings.filter(s => s.package === 'ELITE').length
        };

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalStaked,
                    totalDailyROI: totalDailyROI.toFixed(2),
                    totalROIEarned: totalROIEarned.toFixed(2),
                    activeStakings: stakings.length,
                    fundWallet: user.fundWallet,
                    withdrawWallet: user.withdrawWallet,
                    totalStakedAll: user.totalStaked || 0
                },
                packageBreakdown,
                stakings: stakings.map(s => ({
                    package: s.package,
                    amount: s.amount,
                    dailyROI: s.dailyROI.toFixed(2)
                }))
            }
        });

    } catch (error) {
        console.error('❌ Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET REFERRAL SUMMARY
// ============================================
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
                rankName: ref.rankName || '⭐ Rank 1',
                isActive: totalStaked > 0
            };
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalReferrals: user.directCount,
                    activeReferrals: user.activeReferralCount || 0,
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
                    activeDownlines: downlineDetails.filter(d => d.totalStaked > 0).length,
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

// ============================================
// GET UNLOCKED LEVELS
// ============================================
const getUnlockedLevels = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ userId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                activeReferralCount: user.activeReferralCount || 0,
                unlockedLevels: user.unlockedLevels || 0,
                directCount: user.directCount || 0
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
    createStaking,
    getActiveStakings,
    unstakeStaking,
    getStakingStats,
    getReferralSummary,
    getUnlockedLevels
};