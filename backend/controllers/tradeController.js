const Trade = require('../models/Trade');
const User = require('../models/User');
const BotSettings = require('../models/BotSettings');
const Transaction = require('../models/Transaction');

// ============================================
// PLACE TRADE
// ============================================
const placeTrade = async (req, res) => {
    try {
        const { amount, direction } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!amount || amount < 10) {
            return res.status(400).json({
                success: false,
                message: 'Minimum trade amount is $10'
            });
        }

        if (!['BUY', 'SELL'].includes(direction)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid direction. Use BUY or SELL'
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

        // Check fund wallet balance
        if (user.fundWallet < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: $${user.fundWallet}`
            });
        }

        // Check if trading window is open
        const now = new Date();
        const currentHour = now.getUTCHours();
        
        const botSettings = await BotSettings.findOne();
        const startHour = botSettings?.tradingStartHour || 9;
        const endHour = botSettings?.tradingEndHour || 10;

        if (currentHour < startHour || currentHour >= endHour) {
            return res.status(400).json({
                success: false,
                message: `Trading window is ${startHour}:00-${endHour}:00 UTC`
            });
        }

        // Deduct from fund wallet
        user.fundWallet -= amount;
        await user.save();

        // Generate random entry price (for demo)
        const entryPrice = 50000 + Math.random() * 1000;

        // Create trade
        const trade = await Trade.create({
            userId: user.userId,
            amount,
            direction,
            entryPrice,
            status: 'open',
            result: 'pending',
            windowDate: now
        });

        // Schedule trade closure after 1 minute
        setTimeout(async () => {
            await closeTrade(trade._id);
        }, 60 * 1000); // 1 minute

        res.status(201).json({
            success: true,
            message: '✅ Trade placed successfully!',
            data: {
                tradeId: trade._id,
                amount: trade.amount,
                direction: trade.direction,
                entryPrice: trade.entryPrice.toFixed(2),
                closesAt: new Date(Date.now() + 60 * 1000).toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Place trade error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CLOSE TRADE (called by setTimeout)
// ============================================
const closeTrade = async (tradeId) => {
    try {
        const trade = await Trade.findById(tradeId);
        if (!trade || trade.status !== 'open') return;

        // Get bot settings
        const botSettings = await BotSettings.findOne();
        const winProbability = botSettings?.winProbability || 78;

        // Determine if trade wins or loses
        const random = Math.random() * 100;
        const isWin = random <= winProbability;

        // Calculate exit price (random movement)
        const movement = (Math.random() * 200) - 100; // -100 to +100
        const exitPrice = trade.entryPrice + movement;

        // Calculate profit/loss
        let profit = 0;
        if (isWin) {
            // Win: 70-90% profit
            const profitPercent = 0.7 + Math.random() * 0.2;
            profit = trade.amount * profitPercent;
        } else {
            // Loss: 50-100% loss
            const lossPercent = 0.5 + Math.random() * 0.5;
            profit = -trade.amount * lossPercent;
        }

        // Update trade
        trade.exitPrice = exitPrice;
        trade.profit = profit;
        trade.status = 'closed';
        trade.result = isWin ? 'win' : 'loss';
        trade.closedAt = new Date();
        await trade.save();

        // Add profit/loss to user's withdraw wallet
        const user = await User.findOne({ userId: trade.userId });
        if (user) {
            user.withdrawWallet += profit;
            await user.save();

            // Create transaction record
            await Transaction.create({
                userId: user.userId,
                type: 'trade',
                amount: profit,
                description: `Trade ${isWin ? 'won' : 'lost'}: $${Math.abs(profit).toFixed(2)}`,
                createdAt: new Date()
            });
        }

        // Update bot stats
        await updateBotStats(trade, isWin);

        console.log(`✅ Trade ${tradeId} closed: ${isWin ? 'WIN' : 'LOSS'} $${profit.toFixed(2)}`);

    } catch (error) {
        console.error('❌ Close trade error:', error);
    }
};

// ============================================
// UPDATE BOT STATS
// ============================================
const updateBotStats = async (trade, isWin) => {
    try {
        const botSettings = await BotSettings.findOne();
        if (botSettings) {
            botSettings.totalTrades += 1;
            
            // Recalculate win rate
            const totalWins = await Trade.countDocuments({ result: 'win' });
            const totalTrades = await Trade.countDocuments({ 
                status: 'closed',
                result: { $in: ['win', 'loss'] }
            });
            
            botSettings.winRate = totalTrades > 0 
                ? Math.round((totalWins / totalTrades) * 100) 
                : 78;
            
            botSettings.totalProfit += trade.profit;
            await botSettings.save();
        }
    } catch (error) {
        console.error('Update bot stats error:', error);
    }
};

// ============================================
// GET USER TRADES
// ============================================
const getUserTrades = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const trades = await Trade.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: trades.length,
            data: trades
        });

    } catch (error) {
        console.error('Get user trades error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TRADE STATS
// ============================================
const getTradeStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const trades = await Trade.find({ userId, status: 'closed' });
        
        const wins = trades.filter(t => t.result === 'win').length;
        const losses = trades.filter(t => t.result === 'loss').length;
        const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
        
        const winRate = trades.length > 0 
            ? Math.round((wins / trades.length) * 100) 
            : 0;

        res.json({
            success: true,
            data: {
                totalTrades: trades.length,
                wins,
                losses,
                winRate,
                totalProfit
            }
        });

    } catch (error) {
        console.error('Get trade stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    placeTrade,
    getUserTrades,
    getTradeStats
};