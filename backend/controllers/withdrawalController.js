const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ============================================
// CREATE WITHDRAWAL REQUEST
// ============================================
const createWithdrawal = async (req, res) => {
    try {
        const { amount, walletAddress } = req.body;
        const userId = req.user.userId;

        if (!amount || amount < 10) {
            return res.status(400).json({
                success: false,
                message: 'Minimum withdrawal amount is $10'
            });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.withdrawWallet < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in Withdraw Wallet'
            });
        }

        // Deduct from user's withdraw wallet
        user.withdrawWallet -= amount;
        await user.save();

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
            userId: user.userId,
            userName: user.name,
            amount,
            walletAddress: walletAddress || user.walletAddress || 'Not provided',
            status: 'pending'
        });

        // Create transaction record
        await Transaction.create({
            userId: user.userId,
            type: 'withdrawal_request',
            amount: -amount,
            description: `Withdrawal request of $${amount}`,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: withdrawal
        });

    } catch (error) {
        console.error('Create withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET USER'S WITHDRAWALS
// ============================================
const getUserWithdrawals = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const withdrawals = await Withdrawal.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: withdrawals
        });

    } catch (error) {
        console.error('Get user withdrawals error:', error);
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
        console.error('Get all withdrawals error:', error);
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

        if (!['approved', 'rejected', 'paid'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
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

                await Transaction.create({
                    userId: user.userId,
                    type: 'withdrawal_refund',
                    amount: withdrawal.amount,
                    description: `Withdrawal request rejected - refunded`,
                    createdAt: new Date()
                });
            }
        }

        // If approved/paid, create transaction record
        if (status === 'paid') {
            await Transaction.create({
                userId: withdrawal.userId,
                type: 'withdrawal_paid',
                amount: -withdrawal.amount,
                description: `Withdrawal processed - $${withdrawal.amount}`,
                txHash: txHash,
                createdAt: new Date()
            });
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

module.exports = {
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    processWithdrawal
};