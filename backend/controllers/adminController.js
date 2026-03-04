const Admin = require('../models/Admin');
const User = require('../models/User');
const Staking = require('../models/staking');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

// ============================================
// ADMIN LOGIN
// ============================================
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                token,
                admin: {
                    id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions
                }
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DASHBOARD STATS
// ============================================
const getDashboardStats = async (req, res) => {
    try {
        // User stats
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ 
            totalStaked: { $gt: 0 } 
        });
        const inactiveUsers = totalUsers - activeUsers;
        
        // New users this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newUsersThisWeek = await User.countDocuments({
            createdAt: { $gte: oneWeekAgo }
        });

        // Staking stats
        const stakings = await Staking.find({ status: 'ACTIVE' });
        const totalStaked = stakings.reduce((sum, s) => sum + s.amount, 0);
        
        // Staked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const stakedToday = await Staking.aggregate([
            { $match: { createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Withdrawal stats
        const withdrawals = await Withdrawal.find();
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        
        const withdrawnToday = await Withdrawal.aggregate([
            { $match: { createdAt: { $gte: today }, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingWithdrawals = await Withdrawal.find({ status: 'pending' });
        const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

        // Unstaked total
        const completedStakings = await Staking.find({ status: 'COMPLETED' });
        const unstakedTotal = completedStakings.reduce((sum, s) => sum + s.amount, 0);

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                newUsersThisWeek,
                totalStaked,
                stakedToday: stakedToday[0]?.total || 0,
                activeStaked: totalStaked,
                unstakedTotal,
                totalWithdrawn,
                withdrawnToday: withdrawnToday[0]?.total || 0,
                pendingAmount,
                pendingWithdrawals: pendingWithdrawals.length
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL USERS (with pagination)
// ============================================
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = search ? {
            $or: [
                { userId: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password');

        const total = await User.countDocuments(query);

        // Get staking stats for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const stakings = await Staking.find({ userId: user.userId, status: 'ACTIVE' });
            const totalStaked = stakings.reduce((sum, s) => sum + s.amount, 0);
            
            return {
                ...user.toObject(),
                totalStaked,
                activeStakings: stakings.length
            };
        }));

        res.json({
            success: true,
            data: usersWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET USER DETAILS
// ============================================
const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId }).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const stakings = await Staking.find({ userId: user.userId }).sort({ createdAt: -1 });
        const withdrawals = await Withdrawal.find({ userId: user.userId }).sort({ createdAt: -1 });
        
        // Get referral tree
        const referrals = await User.find({ sponsorId: user.userId })
            .select('userId name email createdAt totalStaked currentRank');

        res.json({
            success: true,
            data: {
                user,
                stakings,
                withdrawals,
                referrals,
                stats: {
                    totalStaked: stakings.reduce((sum, s) => sum + s.amount, 0),
                    activeStakings: stakings.filter(s => s.status === 'ACTIVE').length,
                    totalWithdrawn: withdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0),
                    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length
                }
            }
        });

    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE USER
// ============================================
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields
        if (updates.name) user.name = updates.name;
        if (updates.walletAddress) user.walletAddress = updates.walletAddress;
        if (updates.fundWallet !== undefined) user.fundWallet = updates.fundWallet;
        if (updates.withdrawWallet !== undefined) user.withdrawWallet = updates.withdrawWallet;
        if (updates.status) user.status = updates.status;

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET WITHDRAWAL REQUESTS
// ============================================
const getWithdrawals = async (req, res) => {
    try {
        const { status = 'all', page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = status !== 'all' ? { status } : {};

        const withdrawals = await Withdrawal.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get user details
        const withdrawalsWithUser = await Promise.all(withdrawals.map(async (w) => {
            const user = await User.findOne({ userId: w.userId });
            return {
                ...w.toObject(),
                userName: user?.name || 'Unknown',
                userEmail: user?.email || ''
            };
        }));

        const total = await Withdrawal.countDocuments(query);

        res.json({
            success: true,
            data: withdrawalsWithUser,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PROCESS WITHDRAWAL
// ============================================
const processWithdrawal = async (req, res) => {
    try {
        const { withdrawalId } = req.params;
        const { status, txHash } = req.body;

        if (!['approved', 'rejected', 'paid'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const withdrawal = await Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal already processed'
            });
        }

        withdrawal.status = status;
        withdrawal.processedBy = req.admin?.username || 'admin';
        withdrawal.processedAt = new Date();
        if (txHash) withdrawal.txHash = txHash;

        await withdrawal.save();

        // If rejected, refund to user's withdraw wallet
        if (status === 'rejected') {
            const user = await User.findOne({ userId: withdrawal.userId });
            if (user) {
                user.withdrawWallet += withdrawal.amount;
                await user.save();
            }
        }

        res.json({
            success: true,
            message: `Withdrawal ${status} successfully`,
            data: withdrawal
        });

    } catch (error) {
        console.error('Process withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL STAKINGS
// ============================================
const getStakings = async (req, res) => {
    try {
        const stakings = await Staking.find().sort({ createdAt: -1 }).limit(100);
        
        // Get user details for each staking
        const stakingsWithUser = await Promise.all(stakings.map(async (s) => {
            const user = await User.findOne({ userId: s.userId });
            return {
                ...s.toObject(),
                userName: user?.name || 'Unknown',
                userEmail: user?.email || ''
            };
        }));

        res.json({
            success: true,
            data: stakingsWithUser
        });

    } catch (error) {
        console.error('Get stakings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET UNSTAKE REQUESTS (FIXED: unstake, not unstable)
// ============================================
const getUnstakeRequests = async (req, res) => {
    try {
        const stakings = await Staking.find({ 
            status: 'COMPLETED',
            $or: [{ paid: { $ne: true } }, { paid: { $exists: false } }]
        }).sort({ endDate: -1 });

        const requests = await Promise.all(stakings.map(async (s) => {
            const user = await User.findOne({ userId: s.userId });
            return {
                id: s._id,
                userId: s.userId,
                userName: user?.name || 'Unknown',
                package: s.package,
                amount: s.amount,
                earnings: s.totalROIEarned || 0,
                total: s.amount + (s.totalROIEarned || 0),
                walletAddress: user?.walletAddress || 'Not set',
                status: s.paid ? 'paid' : 'pending',
                endDate: s.endDate,
                createdAt: s.createdAt
            };
        }));

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Get unstake requests error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PROCESS UNSTAKE REQUEST
// ============================================
const processUnstake = async (req, res) => {
    try {
        const { unstakeId } = req.params;
        const { status, txHash } = req.body;

        const staking = await Staking.findById(unstakeId);
        if (!staking) {
            return res.status(404).json({
                success: false,
                message: 'Staking not found'
            });
        }

        if (status === 'completed') {
            staking.paid = true;
            if (txHash) staking.txHash = txHash;
            await staking.save();

            // Add to user's withdraw wallet
            const user = await User.findOne({ userId: staking.userId });
            if (user) {
                user.withdrawWallet += staking.amount + (staking.totalROIEarned || 0);
                await user.save();
            }
        }

        res.json({
            success: true,
            message: 'Unstake processed successfully',
            data: staking
        });

    } catch (error) {
        console.error('Process unstake error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL TRANSACTIONS
// ============================================
const getTransactions = async (req, res) => {
    try {
        const { type = 'all', page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (type !== 'all') {
            query.type = type;
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        // Get user details
        const transactionsWithUser = await Promise.all(transactions.map(async (t) => {
            const user = await User.findOne({ userId: t.userId });
            return {
                ...t.toObject(),
                userName: user?.name || 'Unknown',
                userEmail: user?.email || ''
            };
        }));

        res.json({
            success: true,
            data: transactionsWithUser,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CREATE ADMIN (superadmin only)
// ============================================
const createAdmin = async (req, res) => {
    try {
        const { username, password, email, role, permissions } = req.body;

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists'
            });
        }

        const admin = await Admin.create({
            username,
            password,
            email,
            role: role || 'admin',
            permissions: permissions || {
                manageUsers: true,
                manageWithdrawals: true,
                manageStakings: true,
                manageSettings: false
            }
        });

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// WALLET TRANSFER (Admin to User)
// ============================================
const walletTransfer = async (req, res) => {
    try {
        const { userId, fromWallet, toWallet, amount } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate wallets
        if (fromWallet === 'fund' && user.fundWallet < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient funds in Fund Wallet'
            });
        }
        if (fromWallet === 'withdraw' && user.withdrawWallet < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient funds in Withdraw Wallet'
            });
        }

        // Perform transfer
        if (fromWallet === 'fund') {
            user.fundWallet -= amount;
            if (toWallet === 'withdraw') user.withdrawWallet += amount;
        } else {
            user.withdrawWallet -= amount;
            if (toWallet === 'fund') user.fundWallet += amount;
        }

        await user.save();

        // Create transaction record
        await Transaction.create({
            userId: user.userId,
            type: 'admin_transfer',
            amount: amount,
            description: `Admin transfer from ${fromWallet} to ${toWallet}`,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: 'Transfer successful',
            data: {
                fundWallet: user.fundWallet,
                withdrawWallet: user.withdrawWallet
            }
        });

    } catch (error) {
        console.error('Wallet transfer error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADD STAKING (Admin)
// ============================================
const addStaking = async (req, res) => {
    try {
        const { userId, package: packageName, amount, dailyROI } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate end date based on package
        const period = packageName === 'BASIC' ? 90 : packageName === 'PRO' ? 180 : 450;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + period);

        const staking = await Staking.create({
            user: user._id,
            userId: user.userId,
            package: packageName,
            amount,
            dailyROI,
            dailyPercentage: dailyROI,
            startDate,
            endDate,
            period,
            status: 'ACTIVE',
            lastROITime: startDate,
            totalROIEarned: 0
        });

        // Update user's total staked
        user.totalStaked = (user.totalStaked || 0) + amount;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Staking added successfully',
            data: staking
        });

    } catch (error) {
        console.error('Add staking error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
    adminLogin,
    getDashboardStats,
    getUsers,
    getUserDetails,
    updateUser,
    getWithdrawals,
    processWithdrawal,
    getStakings,
    getUnstakeRequests,  // Fixed: unstake (not unstable)
    processUnstake,
    getTransactions,
    createAdmin,
    walletTransfer,
    addStaking
};