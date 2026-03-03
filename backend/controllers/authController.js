const User = require('../models/User');
const generateUserId = require('../utils/generateUserId');
const jwt = require('jsonwebtoken');

// ==================== REGISTER USER ====================
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, sponsorId } = req.body;

        console.log('Register attempt:', email);

        // Validation
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ 
            $or: [{ email }, { phone }] 
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or phone'
            });
        }

        // Check sponsor exists (if provided)
        if (sponsorId) {
            const sponsor = await User.findOne({ userId: sponsorId });
            if (!sponsor) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sponsor ID'
                });
            }
        }

        // Generate unique userId
        const userId = await generateUserId();

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            sponsorId: sponsorId || null,
            userId,
            isVerified: true,
            fundWallet: 0,
            withdrawWallet: 0,
            totalStaked: 0,
            directCount: 0,
            currentRank: 1
        });

        // Update sponsor's direct referrals
        if (sponsorId) {
            const sponsor = await User.findOne({ userId: sponsorId });
            if (sponsor) {
                sponsor.directReferrals.push(user._id);
                sponsor.directCount = sponsor.directReferrals.length;
                await sponsor.save();
            }
        }

        console.log('User registered successfully:', userId);

        // Return response (without password)
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                sponsorId: user.sponsorId
            }
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};

// ==================== LOGIN USER ====================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', email);

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists by email
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password using the model method
        const isPasswordMatch = await user.comparePassword(password);
        
        if (!isPasswordMatch) {
            console.log('Password mismatch for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { 
                userId: user.userId, 
                email: user.email,
                id: user._id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful:', user.userId);

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    fundWallet: user.fundWallet || 0,
                    withdrawWallet: user.withdrawWallet || 0,
                    totalStaked: user.totalStaked || 0,
                    currentRank: user.currentRank || 1,
                    directCount: user.directCount || 0
                }
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// ==================== GET USER PROFILE ====================
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== EXPORT ALL FUNCTIONS ====================
module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};