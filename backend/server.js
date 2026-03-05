const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const sundayCheck = require('./middleware/sundayCheck');
const { initCronJobs } = require('./controllers/cronController');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: ['https://gainixai-frontend.onrender.com', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// PUBLIC ROUTES
// ============================================
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: '🚀 GAINIX AI Backend Running!',
        timestamp: new Date().toISOString(),
        status: 'online',
        version: '1.0.0'
    });
});

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working properly',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            staking: '/api/staking',
            level: '/api/level',
            salary: '/api/salary',
            referral: '/api/referral',
            team: '/api/team',
            p2p: '/api/p2p',
            settings: '/api/settings',
            admin: '/api/admin',
            withdrawal: '/api/withdrawal',
            wallet: '/api/wallet',
            trade: '/api/trade',
            bot: '/api/bot'
        }
    });
});

// ============================================
// AUTH ROUTES - Login/Register
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));

// ============================================
// STAKING ROUTES - Package buy, unstake, stats
// ============================================
app.use('/api/staking', sundayCheck, require('./routes/stakingRoutes'));

// ============================================
// LEVEL INCOME ROUTES - 5-level team income
// ============================================
app.use('/api/level', sundayCheck, require('./routes/levelRoutes'));

// ============================================
// SALARY RANK ROUTES - 9 ranks weekly salary
// ============================================
app.use('/api/salary', require('./routes/salaryRoutes'));

// ============================================
// REFERRAL ROUTES - Direct referral bonus
// ============================================
app.use('/api/referral', sundayCheck, require('./routes/referralRoutes'));

// ============================================
// TEAM ROUTES - Team structure and downlines
// ============================================
app.use('/api/team', require('./routes/teamRoutes'));

// ============================================
// P2P ROUTES - Peer to peer transfers
// ============================================
app.use('/api/p2p', sundayCheck, require('./routes/p2pRoutes'));
// ============================================
// ADMIN ROUTES - Admin panel
// ============================================
app.use('/api/admin', require('./routes/adminRoutes'));

// ============================================
// WITHDRAWAL ROUTES - Withdrawal requests
// ============================================
app.use('/api/withdrawal', require('./routes/withdrawalRoutes'));

// ============================================
// WALLET ROUTES - Fund and withdraw wallets
// ============================================
app.use('/api/wallet', require('./routes/walletRoutes'));

// ============================================
// SYSTEM STATUS ROUTE
// ============================================
app.get('/api/status', (req, res) => {
    const today = new Date();
    const isSunday = today.getUTCDay() === 0;
    
    res.json({
        success: true,
        server: {
            status: 'online',
            uptime: process.uptime(),
            timestamp: today,
            timezone: 'UTC',
            isSunday: isSunday,
            message: isSunday ? '⚠️ Sunday - Bot Closed' : '✅ Normal Day - All systems operational'
        },
        database: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            name: mongoose.connection.name,
            host: mongoose.connection.host
        },
        routes: {
            auth: '/api/auth',
            staking: '/api/staking',
            level: '/api/level',
            salary: '/api/salary',
            referral: '/api/referral',
            team: '/api/team',
            p2p: '/api/p2p',
            settings: '/api/settings',
            admin: '/api/admin',
            withdrawal: '/api/withdrawal',
            wallet: '/api/wallet',
            trade: '/api/trade',
            bot: '/api/bot'
        }
    });
});

// ============================================
// INITIALIZE CRON JOBS
// ============================================
initCronJobs();

// ============================================
// 404 HANDLER
// ============================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '❌ Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            'GET  /',
            'GET  /api/test',
            'GET  /api/status',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/staking/create',
            'GET  /api/staking/active',
            'GET  /api/staking/stats',
            'POST /api/staking/unstake/:id',
            'GET  /api/level/summary',
            'GET  /api/level/team/:level',
            'GET  /api/level/history',
            'GET  /api/salary/ranks',
            'GET  /api/salary/my-rank',
            'POST /api/salary/check-rank',
            'GET  /api/salary/history',
            'POST /api/salary/distribute',
            'GET  /api/referral/summary',
            'GET  /api/team/tabs/:level',
            'POST /api/p2p/send',
            'GET  /api/p2p/history',
            'GET  /api/settings',
            'POST /api/admin/login',
            'GET  /api/admin/dashboard',
            'GET  /api/admin/users',
            'GET  /api/admin/withdrawals',
            'POST /api/withdrawal/create',
            'GET  /api/withdrawal/my-withdrawals',
            'GET  /api/wallet/balances',
            'POST /api/wallet/deposit',
            'POST /api/trade/place',
            'GET  /api/trade/history',
            'GET  /api/bot/stats'
        ]
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.status(err.status || 500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`🚀 GAINIX AI BACKEND SERVER`);
    console.log(`=================================`);
    console.log(`📡 Server    : http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ MongoDB    : Connected to gainixai`);
    console.log(`⏰ Time       : ${new Date().toUTCString()}`);
    console.log(`📅 Day        : ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`);
    console.log(`=================================\n`);
    
    // Print all routes
    console.log('📌 Available Routes:\n');
    const routes = [
        'GET  /',
        'GET  /api/test',
        'GET  /api/status',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/staking/create',
        'GET  /api/staking/active',
        'GET  /api/staking/stats',
        'POST /api/staking/unstake/:id',
        'GET  /api/level/summary',
        'GET  /api/level/team/:level',
        'GET  /api/level/history',
        'GET  /api/salary/ranks',
        'GET  /api/salary/my-rank',
        'POST /api/salary/check-rank',
        'GET  /api/salary/history',
        'POST /api/salary/distribute',
        'GET  /api/referral/summary',
        'GET  /api/team/tabs/:level',
        'POST /api/p2p/send',
        'GET  /api/p2p/history',
        'GET  /api/settings',
        'POST /api/admin/login',
        'GET  /api/admin/dashboard',
        'GET  /api/admin/users',
        'GET  /api/admin/withdrawals',
        'POST /api/withdrawal/create',
        'GET  /api/withdrawal/my-withdrawals',
        'GET  /api/wallet/balances',
        'POST /api/wallet/deposit',
        'POST /api/trade/place',
        'GET  /api/trade/history',
        'GET  /api/bot/stats'
    ];
    routes.forEach(route => console.log(`   ${route}`));
    console.log(`\n=================================\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;