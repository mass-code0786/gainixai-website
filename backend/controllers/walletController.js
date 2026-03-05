const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ============================================
// DEPOSIT FUNDS
// ============================================
const depositFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.userId;

        if (!amount || amount < 20) {
            return res.status(400).json({
                success: false,
                message: 'Minimum deposit amount is $20'
            });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add to fund wallet
        user.fundWallet += amount;
        await user.save();

        // Create transaction record
        await Transaction.create({
            userId: user.userId,
            type: 'deposit',
            amount: amount,
            description: `Deposit of $${amount}`,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: `✅ $${amount} deposited successfully`,
            data: {
                newBalance: user.fundWallet
            }
        });

    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET WALLET BALANCES
// ============================================
const getWalletBalances = async (req, res) => {
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
                fundWallet: user.fundWallet,
                withdrawWallet: user.withdrawWallet
            }
        });

    } catch (error) {
        console.error('Get wallet balances error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    depositFunds,
    getWalletBalances
};