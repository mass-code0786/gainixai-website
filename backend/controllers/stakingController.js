const Staking = require('../models/staking');
const User = require('../models/User');

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

// @desc    Create new staking
// @route   POST /api/staking/create
// @access  Private
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

        console.log('👤 User found:', { 
            email: user.email, 
            fundWallet: user.fundWallet,
            sponsorId: user.sponsorId 
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
                
                // Update sponsor's direct count if not already counted
                if (!sponsor.directReferrals.includes(user._id)) {
                    sponsor.directReferrals.push(user._id);
                    sponsor.directCount = sponsor.directReferrals.length;
                }
                
                await sponsor.save();
                
                referralMessage = ` + $${referralAmount.toFixed(2)} referral bonus credited to sponsor (${referralPercentage}%)`;
                
                sponsorInfo = {
                    sponsorId: sponsor.userId,
                    amount: referralAmount,
                    percentage: referralPercentage
                };
                
                console.log(`💰 Referral bonus: $${referralAmount} (${referralPercentage}%) credited to ${sponsor.userId}`);
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

// @desc    Get user's active stakings
// @route   GET /api/staking/active
// @access  Private
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

// @desc    Unstake (withdraw) a staking
// @route   POST /api/staking/unstake/:id
// @access  Private
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

// @desc    Get staking statistics
// @route   GET /api/staking/stats
// @access  Private
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

// @desc    Get referral summary
// @route   GET /api/staking/referral-summary
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

        // Get all stakings from downlines
        const downlineUserIds = user.directReferrals.map(ref => ref.userId);
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

        downlineStakings.forEach(staking => {
            const pkg = packages[staking.package];
            if (pkg) {
                const referralAmount = (staking.amount * pkg.referralBonus) / 100;
                earnings[staking.package] += referralAmount;
                earnings.total += referralAmount;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalReferrals: user.directCount,
                totalReferralEarned: earnings.total.toFixed(2),
                earningsByPackage: {
                    BASIC: earnings.BASIC.toFixed(2),
                    PRO: earnings.PRO.toFixed(2),
                    ELITE: earnings.ELITE.toFixed(2)
                },
                downlines: user.directReferrals.map(ref => ({
                    userId: ref.userId,
                    name: ref.name,
                    joinDate: ref.createdAt,
                    totalStaked: ref.totalStaked || 0,
                    activeStakings: downlineStakings.filter(s => s.userId === ref.userId).length
                }))
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

module.exports = {
    createStaking,
    getActiveStakings,
    unstakeStaking,
    getStakingStats,
    getReferralSummary
};