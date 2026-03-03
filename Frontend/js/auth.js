// ==================== LOGIN FUNCTION ====================
async function loginUser(userId, password, remember) {
    try {
        // Check if userId is email or userId
        const isEmail = userId.includes('@');
        
        const loginData = isEmail 
            ? { email: userId, password } 
            : { userId: userId, password };
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        
        if (data.success) {
            // Save token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Remember me
            if (remember) {
                localStorage.setItem('rememberedId', userId);
            } else {
                localStorage.removeItem('rememberedId');
            }
            
            showAlert('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Server error. Please try again.');
    }
}

// ==================== REGISTER FUNCTION ====================
async function registerUser(name, email, phone, password, sponsorId = '') {
    // ... register code
}

// ==================== LOGOUT FUNCTION ====================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==================== SHOW ALERT FUNCTION ====================
function showAlert(message) {
    // Custom alert
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 255, 209, 0.9);
        color: #030507;
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 600;
        z-index: 3000;
        animation: slideDown 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}