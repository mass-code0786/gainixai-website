// API Base URL
const API_BASE_URL = 'https://gainixai-backend.onrender.com/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };

    // Add auth token if required
    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            throw new Error('No token found');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }
        
        return result;
    } catch (error) {
        console.error(`❌ API Error (${endpoint}):`, error);
        throw error;
    }
}

// Auth APIs
async function login(email, password) {
    return apiCall('/auth/login', 'POST', { email, password }, false);
}

async function register(userData) {
    return apiCall('/auth/register', 'POST', userData, false);
}

// Staking APIs
async function createStaking(packageName, amount) {
    return apiCall('/staking/create', 'POST', { package: packageName, amount });
}

async function getActiveStakings() {
    return apiCall('/staking/active');
}

async function getStakingStats() {
    return apiCall('/staking/stats');
}

async function unstakeStaking(id) {
    return apiCall(`/staking/unstake/${id}`, 'POST');
}

// Level APIs
async function getLevelSummary() {
    return apiCall('/level/summary');
}

async function getTeamByLevel(level) {
    return apiCall(`/level/team/${level}`);
}

async function getLevelHistory(level = null) {
    let url = '/level/history';
    if (level) url += `?level=${level}`;
    return apiCall(url);
}

// Salary APIs
async function getSalaryRanks() {
    return apiCall('/salary/ranks', 'GET', null, false);
}

async function getMyRank() {
    return apiCall('/salary/my-rank');
}

async function checkRankEligibility() {
    return apiCall('/salary/check-rank', 'POST', {});
}

async function getSalaryHistory() {
    return apiCall('/salary/history');
}

// Referral APIs
async function getReferralSummary() {
    return apiCall('/referral/summary');
}

async function getDownlines() {
    return apiCall('/referral/downlines');
}

async function getCommissionHistory() {
    return apiCall('/referral/commissions');
}

async function getReferralStats() {
    return apiCall('/referral/stats');
}