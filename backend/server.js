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
// PUBLIC ROUTES
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
            admin: '/api/admin'
        }
    });
});

// ============================================
// API ROUTES
// ============================================

// Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Staking Routes
app.use('/api/staking', sundayCheck, require('./routes/stakingRoutes'));

// Level Routes
app.use('/api/level', sundayCheck, require('./routes/levelRoutes'));

// Salary Routes
app.use('/api/salary', require('./routes/salaryRoutes'));

// Referral Routes
app.use('/api/referral', sundayCheck, require('./routes/referralRoutes'));

// Team Routes
app.use('/api/team', require('./routes/teamRoutes'));

// P2P Routes
app.use('/api/p2p', sundayCheck, require('./routes/p2pRoutes'));

// Settings Routes
app.use('/api/settings', require('./routes/settingRoutes'));

// Admin Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/withdrawal', require('./routes/withdrawalRoutes'));

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
        }
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '❌ Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER - PORT BINDING WITH AUTO-RETRY
// ============================================
const startServer = (port) => {
    const server = app.listen(port)
        .on('listening', () => {
            console.log(`\n=================================`);
            console.log(`🚀 GAINIX AI BACKEND SERVER`);
            console.log(`=================================`);
            console.log(`📡 Server    : http://localhost:${port}`);
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
                'GET  /api/team/level/:level',
                'GET  /api/team/tabs/:level',
                'POST /api/p2p/send',
                'GET  /api/p2p/history',
                'GET  /api/settings',
                'POST /api/admin/login',
                'GET  /api/admin/dashboard',
                'GET  /api/admin/users',
                'GET  /api/admin/withdrawals'
            ];
            routes.forEach(route => console.log(`   ${route}`));
            console.log(`\n=================================\n`);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`❌ Port ${port} is busy, trying ${port + 1}...`);
                startServer(port + 1);
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });
};

// Start server with initial port
const initialPort = parseInt(process.env.PORT) || 8080;
startServer(initialPort);

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Closing server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Closing server...');
    process.exit(0);
});

module.exports = app;