const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ============================================
// CREATE WITHDRAWAL REQUEST
// ============================================
const createWithdrawal = async (req, res) => {
    try {
        const { amount, walletAddress } = req.body;
        const userId = req.user?.userId;

        console.log('📤 Withdrawal request received:', { userId, amount, walletAddress });

        // Validation
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!amount || amount < 10) {
            return res.status(400).json({
                success: false,
                message: 'Minimum withdrawal amount is $10'
            });
        }

        if (!walletAddress || walletAddress.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Valid wallet address is required'
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
            userId: user.userId, 
            withdrawWallet: user.withdrawWallet 
        });

        // Check balance
        if (user.withdrawWallet < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: $${user.withdrawWallet}`
            });
        }

        // Deduct from user's withdraw wallet
        user.withdrawWallet -= amount;
        await user.save();

        console.log('💰 Amount deducted. New balance:', user.withdrawWallet);

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
            userId: user.userId,
            userName: user.name || 'Unknown',
            amount,
            walletAddress,
            status: 'pending',
            createdAt: new Date()
        });

        console.log('✅ Withdrawal request created:', withdrawal._id);

        // Create transaction record
        await Transaction.create({
            userId: user.userId,
            type: 'withdrawal_request',
            amount: -amount,
            description: `Withdrawal request of $${amount} to ${walletAddress.substring(0,6)}...`,
            status: 'pending',
            createdAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: '✅ Withdrawal request submitted successfully',
            data: {
                id: withdrawal._id,
                amount: withdrawal.amount,
                status: withdrawal.status,
                walletAddress: withdrawal.walletAddress,
                createdAt: withdrawal.createdAt,
                newBalance: user.withdrawWallet
            }
        });

    } catch (error) {
        console.error('❌ Create withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// GET USER'S WITHDRAWALS
// ============================================
const getUserWithdrawals = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const withdrawals = await Withdrawal.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: withdrawals.length,
            data: withdrawals
        });

    } catch (error) {
        console.error('❌ Get user withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL WITHDRAWALS (ADMIN)
// ============================================
const getAllWithdrawals = async (req, res) => {
    try {
        const { status = 'all', page = 1, limit = 20 } = req.query;
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
        console.error('❌ Get all withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PROCESS WITHDRAWAL (ADMIN)
// ============================================
const processWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, txHash } = req.body;

        console.log('📋 Processing withdrawal:', { id, status, txHash });

        if (!['approved', 'rejected', 'paid'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Use: approved, rejected, or paid'
            });
        }

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Withdrawal already ${withdrawal.status}`
            });
        }

        // Update withdrawal
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

                await Transaction.create({
                    userId: user.userId,
                    type: 'withdrawal_refund',
                    amount: withdrawal.amount,
                    description: `Withdrawal #${withdrawal._id} rejected - refunded`,
                    createdAt: new Date()
                });
                console.log('💰 Refund processed for user:', user.userId);
            }
        }

        // If approved/paid, create transaction record
        if (status === 'paid') {
            await Transaction.create({
                userId: withdrawal.userId,
                type: 'withdrawal_paid',
                amount: -withdrawal.amount,
                description: `Withdrawal #${withdrawal._id} processed`,
                txHash: txHash,
                createdAt: new Date()
            });
            console.log('✅ Withdrawal marked as paid');
        }

        res.json({
            success: true,
            message: `✅ Withdrawal ${status} successfully`,
            data: withdrawal
        });

    } catch (error) {
        console.error('❌ Process withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET WITHDRAWAL STATS (ADMIN)
// ============================================
const getWithdrawalStats = async (req, res) => {
    try {
        const pending = await Withdrawal.countDocuments({ status: 'pending' });
        const approved = await Withdrawal.countDocuments({ status: 'approved' });
        const paid = await Withdrawal.countDocuments({ status: 'paid' });
        const rejected = await Withdrawal.countDocuments({ status: 'rejected' });

        const totalAmount = await Withdrawal.aggregate([
            { $match: { status: { $in: ['paid', 'approved'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                counts: { pending, approved, paid, rejected },
                totalProcessed: totalAmount[0]?.total || 0
            }
        });

    } catch (error) {
        console.error('❌ Get withdrawal stats error:', error);
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
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    processWithdrawal,
    getWithdrawalStats
};