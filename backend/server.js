const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const sundayCheck = require('./middleware/sundayCheck');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: ['https://gainixai-frontend.onrender.com', 'http://localhost:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// 📌 PUBLIC ROUTES (No Auth Required)
// ============================================

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: '🚀 GAINIX AI Backend Running!',
        timestamp: new Date().toISOString(),
        status: 'online',
        version: '1.0.0'
    });
});

// API test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ API is working properly',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            staking: '/api/staking',
            level: '/api/level',
            salary: '/api/salary',
            referral: '/api/referral'
        }
    });
});

// ============================================
// 🔥 API ROUTES - ALL WORKING
// ============================================

// Auth Routes (Login/Register) - No Sunday check
app.use('/api/auth', require('./routes/authRoutes'));

// Staking Routes - With Sunday check
app.use('/api/staking', sundayCheck, require('./routes/stakingRoutes'));

// Level Routes - With Sunday check
app.use('/api/level', sundayCheck, require('./routes/levelRoutes'));

// Salary Routes - No Sunday check for viewing
app.use('/api/salary', require('./routes/salaryRoutes'));

// ✅ Referral Routes - With Sunday check (YE LINE IMPORTANT HAI)
app.use('/api/referral', sundayCheck, require('./routes/referralRoutes'));
// Add this line with other routes
app.use('/api/p2p', require('./routes/p2pRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
// Add this line with other routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));

// ============================================
// 📊 System Status Route
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
            status: '/api/status',
            test: '/api/test'
        }
    });
});

// ============================================
// ❌ 404 Handler - Route not found
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
            'GET  /api/referral/downlines',
            'GET  /api/referral/commissions',
            'GET  /api/referral/stats'
        ]
    });
});

// ============================================
// ⚠️ Global Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
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
// 🚀 Start Server
// ============================================
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`\n`);
    console.log(`══════════════════════════════════════════════`);
    console.log(`   🚀  GAINIX AI BACKEND SERVER`);
    console.log(`══════════════════════════════════════════════`);
    console.log(`   📡 Server    : http://localhost:${PORT}`);
    console.log(`   📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ✅ MongoDB    : Connected to gainixai`);
    console.log(`   ⏰ Time       : ${new Date().toUTCString()}`);
    console.log(`   📅 Day        : ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`);
    console.log(`══════════════════════════════════════════════`);
    console.log(`\n📌 Available Routes:\n`);
    console.log('🚀 Server starting on port:', PORT);
const server = app.listen(PORT, () => {
    console.log(`✅ Server successfully listening on port ${PORT}`);
});
    
    const routes = [
        { method: 'GET', path: '/', desc: 'Health check' },
        { method: 'GET', path: '/api/test', desc: 'API test' },
        { method: 'GET', path: '/api/status', desc: 'System status' },
        { method: 'POST', path: '/api/auth/register', desc: 'Register new user' },
        { method: 'POST', path: '/api/auth/login', desc: 'Login user' },
        { method: 'POST', path: '/api/staking/create', desc: 'Create new staking' },
        { method: 'GET', path: '/api/staking/active', desc: 'Get active stakings' },
        { method: 'GET', path: '/api/staking/stats', desc: 'Get staking statistics' },
        { method: 'POST', path: '/api/staking/unstake/:id', desc: 'Unstake position' },
        { method: 'GET', path: '/api/level/summary', desc: 'Level income summary' },
        { method: 'GET', path: '/api/level/team/:level', desc: 'Team by level' },
        { method: 'GET', path: '/api/level/history', desc: 'Level income history' },
        { method: 'GET', path: '/api/salary/ranks', desc: 'All salary ranks' },
        { method: 'GET', path: '/api/salary/my-rank', desc: 'Current rank & progress' },
        { method: 'POST', path: '/api/salary/check-rank', desc: 'Check rank eligibility' },
        { method: 'GET', path: '/api/salary/history', desc: 'Salary history' },
        { method: 'POST', path: '/api/salary/distribute', desc: 'Distribute weekly salary (Admin)' },
        { method: 'GET', path: '/api/referral/summary', desc: 'Referral earnings summary' },
        { method: 'GET', path: '/api/referral/downlines', desc: 'Downline list with details' },
        { method: 'GET', path: '/api/referral/commissions', desc: 'Commission history' },
        { method: 'GET', path: '/api/referral/stats', desc: 'Referral statistics' }
    ];

    routes.forEach(route => {
        const method = route.method.padEnd(6);
        const path = route.path.padEnd(30);
        console.log(`   ${method} ${path} - ${route.desc}`);
    });

    console.log(`\n══════════════════════════════════════════════\n`);
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