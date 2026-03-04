const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connected');

        const adminExists = await Admin.findOne({ username: 'admin' });
        
        if (!adminExists) {
            await Admin.create({
                username: 'admin',
                password: 'Admin@123',
                email: 'admin@gainixai.live',
                role: 'superadmin',
                permissions: {
                    manageUsers: true,
                    manageWithdrawals: true,
                    manageStakings: true,
                    manageSettings: true
                }
            });
            console.log('✅ Default admin created');
            console.log('Username: admin');
            console.log('Password: Admin@123');
        } else {
            console.log('Admin already exists');
        }

        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });