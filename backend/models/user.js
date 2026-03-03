const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    sponsorId: {
        type: String,
        default: null
    },
    userId: {
        type: String,
        unique: true,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    fundWallet: {
        type: Number,
        default: 0
    },
    withdrawWallet: {
        type: Number,
        default: 0
    },
    totalStaked: {
        type: Number,
        default: 0
    },
    directReferrals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    directCount: {
        type: Number,
        default: 0
    },
    teamBusiness: {
        type: Number,
        default: 0
    },
    currentRank: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hash middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// User ID generate karne ka function
userSchema.pre('save', async function(next) {
    if (!this.userId) {
        const count = await mongoose.model('User').countDocuments();
        this.userId = `Gainix${100001 + count}`;
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);