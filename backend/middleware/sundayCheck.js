const sundayCheck = (req, res, next) => {
    const today = new Date();
    const isSunday = today.getUTCDay() === 0;
    
    if (isSunday) {
        return res.status(400).json({
            success: false,
            message: '❌ Sunday - Bot Closed. No transactions or income generation allowed.',
            isSunday: true
        });
    }
    
    next();
};

module.exports = sundayCheck;