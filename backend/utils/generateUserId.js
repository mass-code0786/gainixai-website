const User = require('../models/User');

const generateUserId = async () => {
    const count = await User.countDocuments();
    const nextNumber = 100001 + count;
    return `Gainix${nextNumber}`;
};

module.exports = generateUserId;