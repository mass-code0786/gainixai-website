const Admin = require('../models/Admin');
const User = require('../models/User');
const Staking = require('../models/Staking');
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
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ 
            totalStaked: { $gt: 0 } 
        });
        
        const totalStakings = await Staking.countDocuments({ status: 'ACTIVE' });
        const totalStakedAmount = await Staking.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingWithdrawals = await Withdrawal.countDocuments({ 
            status: 'pending' 
        });
        
        const pendingAmount = await Withdrawal.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('userId name email createdAt');

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                totalStakings,
                totalStaked: totalStakedAmount[0]?.total || 0,
                pendingWithdrawals,
                pendingAmount: pendingAmount[0]?.total || 0,
                recentUsers
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
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
// GET WITHDRAWAL REQUESTS
// ============================================
const getWithdrawals = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = status !== 'all' ? { status } : {};

        const withdrawals = await Withdrawal.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Withdrawal.countDocuments(query);

        res.json({
            success: true,
            data: withdrawals,
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
        const { status, remarks } = req.body;

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
        withdrawal.processedBy = req.admin.username;
        withdrawal.processedAt = new Date();
        withdrawal.remarks = remarks;

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

module.exports = {
    adminLogin,
    getDashboardStats,
    getUsers,
    getUserDetails,
    getWithdrawals,
    processWithdrawal,
    createAdmin
};