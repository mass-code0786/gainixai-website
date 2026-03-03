const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not Found');
        
        const uri = process.env.MONGODB_URI;
        
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;