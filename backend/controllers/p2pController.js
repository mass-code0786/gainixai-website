const User = require('../models/User');
const Transaction = require('../models/Transaction');
const P2PTransaction = require('../models/P2PTransaction');

// ============================================
// SEND P2P TRANSFER
// ============================================
const sendP2P = async (req, res) => {
    try {
        const { recipientId, amount, pin } = req.body;
        const senderId = req.user.userId;

        // Validation
        if (!recipientId || !amount || !pin) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (amount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minimum transfer amount is $1'
            });
        }

        // Get sender
        const sender = await User.findOne({ userId: senderId });
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: 'Sender not found'
            });
        }

        // Check withdraw wallet balance
        if (sender.withdrawWallet < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance in Withdraw Wallet'
            });
        }

        // Get recipient
        const recipient = await User.findOne({ userId: recipientId });
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Recipient not found'
            });
        }

        // PIN verification (you can implement proper PIN system)
        // For now, just check if PIN is 4 digits
        if (pin.length !== 4) {
            return res.status(400).json({
                success: false,
                message: 'Invalid PIN'
            });
        }

        // Process transfer
        sender.withdrawWallet -= amount;
        recipient.withdrawWallet += amount;

        await sender.save();
        await recipient.save();

        // Create P2P transaction record
        const p2pTransaction = await P2PTransaction.create({
            senderId: sender.userId,
            receiverId: recipient.userId,
            amount: amount,
            status: 'completed',
            senderBalance: sender.withdrawWallet,
            receiverBalance: recipient.withdrawWallet
        });

        // Create transaction history for sender
        await Transaction.create({
            userId: sender.userId,
            type: 'p2p_sent',
            amount: -amount,
            toUserId: recipient.userId,
            description: `P2P Transfer to ${recipient.userId}`,
            createdAt: new Date()
        });

        // Create transaction history for recipient
        await Transaction.create({
            userId: recipient.userId,
            type: 'p2p_received',
            amount: amount,
            fromUserId: sender.userId,
            description: `P2P Transfer from ${sender.userId}`,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: 'P2P transfer successful',
            data: {
                transactionId: p2pTransaction._id,
                amount: amount,
                recipientId: recipient.userId,
                senderBalance: sender.withdrawWallet
            }
        });

    } catch (error) {
        console.error('P2P Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET P2P HISTORY
// ============================================
const getP2PHistory = async (req, res) => {
    try {
        const userId = req.user.userId;

        const transactions = await P2PTransaction.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }).sort({ createdAt: -1 }).limit(50);

        const history = transactions.map(t => {
            const isSender = t.senderId === userId;
            return {
                id: t._id,
                type: isSender ? 'sent' : 'received',
                amount: t.amount,
                otherParty: isSender ? t.receiverId : t.senderId,
                date: t.createdAt,
                status: t.status,
                balance: isSender ? t.senderBalance : t.receiverBalance
            };
        });

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    sendP2P,
    getP2PHistory
};