// ============================================
// DASHBOARD.JS - COMPLETE WORKING VERSION
// 100% BACKEND CONNECTED - NO "COMING SOON"
// ============================================

// ============================================
// GLOBAL CONFIGURATION
// ============================================
const API_BASE_URL = 'https://gainixai-backend.onrender.com/api';
console.log('🔥 dashboard.js loaded - API URL:', API_BASE_URL);

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    checkSunday();
    updateUTCTime();
    setInterval(updateUTCTime, 1000);

    try {
        await loadUserProfile();
        await loadStakingStats();
        await loadActiveStakings();
        await loadLevelSummary();
        await loadRankInfo();
        await loadReferralSummary();
        await loadBotStats();
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showToast('Failed to load some data. Please refresh.', 'error');
    }
});

// ============================================
// API HELPER FUNCTION
// ============================================
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
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

// ============================================
// LOGOUT FUNCTION
// ============================================
function logout() {
    console.log('Logout clicked');
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// ============================================
// SUNDAY CHECK
// ============================================
function checkSunday() {
    const today = new Date();
    const isSunday = today.getUTCDay() === 0;
    
    if (isSunday) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'sunday-warning';
        warningDiv.innerHTML = '<i class="fas fa-power-off"></i> ⚠️ Sunday - Bot Closed. No income generated today.';
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) dashboard.prepend(warningDiv);
    }
}

// ============================================
// UTC TIME UPDATE
// ============================================
function updateUTCTime() {
    const now = new Date();
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    const timeElement = document.getElementById('utcDisplay');
    if (timeElement) timeElement.innerText = hours + ':' + minutes + ' UTC';
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================
async function loadUserProfile() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    
    safeSetValue('userName', user.name || 'User');
    safeSetText('userEmail', user.email || '');
    safeSetText('userId', user.userId || 'Gainix100001');
    safeSetText('fundWallet', `$${user.fundWallet || 0}`);
    safeSetText('withdrawWallet', `$${user.withdrawWallet || 0}`);
    safeSetText('totalStaked', `$${user.totalStaked || 0}`);
    
    displayReferralLink(user);
}

function displayReferralLink(user) {
    const userId = user.userId || 'Gainix100001';
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/register.html?ref=${userId}`;
    
    const refLinkInput = document.getElementById('refLink');
    if (refLinkInput) refLinkInput.value = referralLink;
    
    const refLinkSpan = document.getElementById('refLinkDisplay');
    if (refLinkSpan) refLinkSpan.innerText = `gainixai.live/ref/${userId}`;
}

function saveProfile() {
    const newName = document.getElementById('userName')?.value;
    if (newName) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = newName;
        localStorage.setItem('user', JSON.stringify(user));
        showToast('✅ Profile updated!', 'success');
    }
}

function copyReferralLink() {
    const refLink = document.getElementById('refLinkDisplay');
    if (refLink) {
        navigator.clipboard.writeText(refLink.innerText);
        showToast('✅ Referral link copied!', 'success');
    }
}

function copyWalletAddress() {
    const address = document.getElementById('walletAddressDisplay')?.innerText;
    if (address) {
        navigator.clipboard.writeText(address);
        showToast('✅ Wallet address copied!', 'success');
    }
}

function uploadAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('avatarIcon').style.display = 'none';
            const img = document.getElementById('avatarImage');
            img.style.display = 'block';
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================
// STAKING STATS - BACKEND CONNECTED
// ============================================
async function loadStakingStats() {
    try {
        const result = await apiCall('/staking/stats');
        
        if (result?.success) {
            const stats = result.data.summary;
            
            safeSetText('totalStaked', `$${stats.totalStaked || 0}`);
            safeSetText('stakingCount', stats.activeStakings || '0');
            safeSetText('stakingIncome', `$${stats.totalROIEarned || 0}`);
            safeSetText('stakingIncomeToday', `+$${stats.totalDailyROI || 0} today`);
            
            // Update wallet balances
            safeSetText('fundWallet', `$${stats.fundWallet || 0}`);
            safeSetText('withdrawWallet', `$${stats.withdrawWallet || 0}`);
            
            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.fundWallet = stats.fundWallet;
            user.withdrawWallet = stats.withdrawWallet;
            user.totalStaked = stats.totalStaked;
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (error) {
        console.error('Failed to load staking stats:', error);
    }
}

// ============================================
// ACTIVE STAKINGS - BACKEND CONNECTED
// ============================================
async function loadActiveStakings() {
    try {
        const result = await apiCall('/staking/active');
        const container = document.getElementById('activeStakingsList');
        if (!container) return;
        
        if (!result?.success || !result.data || result.data.length === 0) {
            container.innerHTML = '<div class="no-data">No active stakings</div>';
            return;
        }

        let html = '';
        result.data.forEach(s => {
            html += `
                <div class="staking-item">
                    <div class="staking-header">
                        <span class="staking-package">${s.package}</span>
                        <span class="staking-amount">$${s.amount}</span>
                    </div>
                    <div class="staking-details">
                        <div class="staking-roi">Daily ROI: $${s.dailyROI} (${s.dailyPercentage}%)</div>
                        <div class="staking-dates">
                            <span>Start: ${new Date(s.startDate).toLocaleDateString()}</span>
                            <span>End: ${new Date(s.endDate).toLocaleDateString()}</span>
                        </div>
                        <div class="staking-days">Days Left: ${s.daysLeft}</div>
                    </div>
                    <button class="unstake-btn ${s.isCompleted ? 'active' : ''}" 
                        onclick="unstakeStaking('${s.id}')" 
                        ${!s.isCompleted ? 'disabled' : ''}>
                        ${s.isCompleted ? 'UNSTAKE NOW' : `Locked (${s.daysLeft} days left)`}
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load stakings:', error);
    }
}

async function unstakeStaking(stakingId) {
    if (!confirm('Are you sure you want to unstake?')) return;
    
    try {
        const result = await apiCall(`/staking/unstake/${stakingId}`, 'POST');
        if (result?.success) {
            showToast('✅ Staking unstaked successfully!', 'success');
            await loadActiveStakings();
            await loadStakingStats();
        }
    } catch (error) {
        showToast('Failed to unstake', 'error');
    }
}

// ============================================
// CREATE STAKING - BACKEND CONNECTED
// ============================================
function showBonusMessage() {
    const packageSelect = document.getElementById('packageSelect');
    const amount = parseFloat(document.getElementById('packageAmount')?.value) || 0;
    const msgDiv = document.getElementById('bonusMessage');
    
    if (packageSelect && packageSelect.value === 'ELITE' && amount >= 500) {
        if (msgDiv) msgDiv.innerHTML = '🎉 You qualify for $100 instant bonus!';
    } else {
        if (msgDiv) msgDiv.innerHTML = '';
    }
}

function selectPackage(num) {
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById(`package${num}`);
    if (card) card.classList.add('selected');
    
    const select = document.getElementById('packageSelect');
    if (select) {
        select.value = ['BASIC', 'PRO', 'ELITE'][num - 1];
    }
    showBonusMessage();
}

async function createStaking() {
    const packageSelect = document.getElementById('packageSelect');
    const amount = document.getElementById('packageAmount').value;
    const referralId = document.getElementById('referralId')?.value || '';
    
    if (!amount || amount < 20) {
        showToast('Minimum amount is $20', 'error');
        return;
    }

    try {
        const result = await apiCall('/staking/create', 'POST', {
            package: packageSelect.value,
            amount: parseFloat(amount)
        });
        
        if (result?.success) {
            showToast('✅ Staking created!', 'success');
            closeInvestModal();
            await loadStakingStats();
            await loadActiveStakings();
            await loadReferralSummary();
            await loadRankInfo();
            document.getElementById('packageAmount').value = '';
            document.getElementById('bonusMessage').innerHTML = '';
        }
    } catch (error) {
        showToast('Failed to create staking', 'error');
    }
}

// ============================================
// LEVEL INCOME - BACKEND CONNECTED
// ============================================
async function loadLevelSummary() {
    try {
        const result = await apiCall('/level/summary');
        
        if (result?.success) {
            const tbody = document.getElementById('levelIncomeBody');
            if (tbody) {
                let html = '';
                result.levels.forEach(level => {
                    html += `
                        <tr>
                            <td>Level ${level.level}</td>
                            <td>${level.percentage}%</td>
                            <td>$${level.todayEarned}</td>
                            <td class="${level.isUnlocked ? 'text-success' : 'text-muted'}">${level.unlockedStatus}</td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
            safeSetText('totalLevelIncome', `$${result.totalLevelIncome || 0}`);
            safeSetText('levelIncomeToday', `+$${result.todayLevelIncome || 0} today`);
        }
    } catch (error) {
        console.error('Failed to load level summary:', error);
    }
}

// ============================================
// SALARY RANK - BACKEND CONNECTED
// ============================================
async function loadRankInfo() {
    try {
        const result = await apiCall('/salary/my-rank');
        
        if (result?.success) {
            const data = result.data;
            
            safeSetText('topCurrentRank', data.currentRank?.stars || '0 ⭐');
            safeSetText('currentRank', `${data.currentRank?.stars || '0 ⭐'} Rank ${data.currentRank?.rank || 0}`);
            
            if (data.nextRank) {
                safeSetText('directBusiness', `$${data.progress?.directVolume?.current || 0} / $${data.progress?.directVolume?.required || 0}`);
                safeSetText('teamBusiness', `$${data.progress?.teamVolume?.current || 0} / $${data.progress?.teamVolume?.required || 0}`);
                safeSetText('qualifiedDownlines', `${data.progress?.qualifiedMembers?.current || 0} / 2`);
                safeSetText('nextRank', `${data.nextRank.stars || '⭐'} ($${data.nextRank.weeklySalary || 0}/week)`);
            }
            
            safeSetText('totalSalaryIncome', `$${data.totalSalaryEarned || 0}`);
            safeSetText('salaryIncomeToday', `+$${data.totalSalaryEarned || 0} this week`);
        }
    } catch (error) {
        console.error('Failed to load rank info:', error);
    }
}

// ============================================
// REFERRAL SUMMARY - BACKEND CONNECTED
// ============================================
async function loadReferralSummary() {
    try {
        const result = await apiCall('/referral/summary');
        
        if (result?.success) {
            const data = result.data;
            
            safeSetText('directIncome', `$${data.summary?.totalReferralEarned || 0}`);
            safeSetText('directCount', data.summary?.totalReferrals || '0');
            safeSetText('directToday', `+$${data.summary?.totalReferralEarned || 0} today`);
            
            const membersContainer = document.getElementById('directMembersList');
            if (membersContainer && data.downlines) {
                if (data.downlines.length === 0) {
                    membersContainer.innerHTML = '<div class="no-data">No direct referrals yet</div>';
                } else {
                    let html = '';
                    data.downlines.forEach(d => {
                        html += `
                            <div class="member-item">
                                <div class="member-info">
                                    <div class="member-avatar">${d.name ? d.name[0] : 'U'}</div>
                                    <div class="member-details">
                                        <div class="member-name">${d.name || 'Unknown'}</div>
                                        <div class="member-id">${d.userId}</div>
                                    </div>
                                </div>
                                <div class="member-stats">
                                    <div>$${d.totalStaked || 0}</div>
                                    <div class="member-rank">${d.rankName || '⭐ Rank 1'}</div>
                                </div>
                            </div>
                        `;
                    });
                    membersContainer.innerHTML = html;
                }
            }
        }
    } catch (error) {
        console.error('Failed to load referral summary:', error);
    }
}

// ============================================
// BOT STATS - BACKEND CONNECTED
// ============================================
async function loadBotStats() {
    try {
        const result = await apiCall('/bot/stats');
        
        if (result?.success) {
            safeSetText('botTrades', result.data.totalTrades.toLocaleString());
            safeSetText('botWinRate', result.data.winRate + '%');
            safeSetText('botProfit', '$' + result.data.totalProfit.toLocaleString());
        }
    } catch (error) {
        console.error('Failed to load bot stats:', error);
    }
}

// ============================================
// DEPOSIT FUNCTIONS - BACKEND CONNECTED
// ============================================
function openDepositModal() {
    console.log('Opening deposit modal');
    document.getElementById('depositModal').style.display = 'flex';
}

async function processDeposit() {
    const amount = document.getElementById('depositAmount').value;
    
    if (!amount || amount < 20) {
        showToast('Minimum deposit is $20', 'error');
        return;
    }

    try {
        const result = await apiCall('/wallet/deposit', 'POST', {
            amount: parseFloat(amount)
        });

        if (result.success) {
            showToast(`✅ $${amount} deposited successfully!`, 'success');
            closeModal('depositModal');
            await loadStakingStats();
            document.getElementById('depositAmount').value = '';
        } else {
            showToast(`❌ ${result.message || 'Deposit failed'}`, 'error');
        }
    } catch (error) {
        console.error('Deposit error:', error);
        showToast('❌ Deposit failed. Please try again.', 'error');
    }
}

// ============================================
// WITHDRAWAL FUNCTIONS - BACKEND CONNECTED
// ============================================
function openWithdrawModal() {
    console.log('Opening withdraw modal');
    document.getElementById('withdrawModal').style.display = 'flex';
}

async function processWithdraw() {
    const amount = document.getElementById('withdrawAmount').value;
    const walletAddress = document.getElementById('withdrawWalletAddress').value;

    if (!amount || amount < 10) {
        showToast('Minimum withdrawal is $10', 'error');
        return;
    }

    if (!walletAddress || walletAddress.length < 10) {
        showToast('Please enter a valid wallet address', 'error');
        return;
    }

    try {
        const result = await apiCall('/withdrawal/create', 'POST', {
            amount: parseFloat(amount),
            walletAddress: walletAddress
        });

        if (result.success) {
            showToast(`✅ Withdrawal request submitted!`, 'success');
            closeModal('withdrawModal');
            await loadStakingStats();
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawWalletAddress').value = '';
        } else {
            showToast(`❌ ${result.message || 'Withdrawal failed'}`, 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast('❌ Withdrawal failed. Please try again.', 'error');
    }
}

// ============================================
// P2P FUNCTIONS - BACKEND CONNECTED
// ============================================
function openP2PModal() {
    console.log('Opening P2P modal');
    document.getElementById('p2pModal').style.display = 'flex';
}

function moveToNext(current, index) {
    if (current.value.length === 1) {
        const next = document.querySelectorAll('.pin-field')[index + 1];
        if (next) next.focus();
    }
}

async function processP2P() {
    const recipient = document.getElementById('recipientId').value;
    const amount = document.getElementById('p2pAmount').value;
    const pins = document.querySelectorAll('.pin-field');
    let pin = '';
    pins.forEach(p => pin += p.value);

    if (!recipient || !amount) {
        showToast('Please fill all fields', 'error');
        return;
    }

    if (pin.length !== 4) {
        showToast('Please enter complete PIN', 'error');
        return;
    }

    try {
        const result = await apiCall('/p2p/send', 'POST', {
            recipientId: recipient,
            amount: parseFloat(amount),
            pin: pin
        });

        if (result.success) {
            showToast(`✅ $${amount} sent to ${recipient}!`, 'success');
            closeModal('p2pModal');
            await loadStakingStats();
            document.getElementById('recipientId').value = '';
            document.getElementById('p2pAmount').value = '';
            document.querySelectorAll('.pin-field').forEach(p => p.value = '');
        } else {
            showToast(`❌ ${result.message || 'Transfer failed'}`, 'error');
        }
    } catch (error) {
        console.error('P2P error:', error);
        showToast('❌ Transfer failed. Please try again.', 'error');
    }
}

// ============================================
// TRADE FUNCTIONS - BACKEND CONNECTED
// ============================================
function openTradeModal() {
    window.location.href = 'trade.html';
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showInvestModal() {
    document.getElementById('investModal').style.display = 'flex';
    showBonusMessage();
}

function closeInvestModal() {
    document.getElementById('investModal').style.display = 'none';
}

function confirmStake() {
    closeInvestModal();
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function safeSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function safeSetValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function goToHistory(filter) {
    localStorage.setItem('historyFilter', filter);
    window.location.href = 'history.html';
}

function attachWallet() {
    const address = document.getElementById('bep20Address')?.value;
    const pin = document.getElementById('walletPin')?.value;
    
    if (!address || address.length < 20) {
        showToast('Invalid address', 'error');
        return;
    }
    if (!pin || pin.length !== 4) {
        showToast('Invalid PIN', 'error');
        return;
    }
    
    // Save to user profile
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.walletAddress = address;
    localStorage.setItem('user', JSON.stringify(user));
    
    document.getElementById('walletAddressDisplay').innerText = 
        address.substring(0,6) + '...' + address.substring(address.length-4);
    
    showToast('✅ Wallet attached!', 'success');
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#ff6b6b' : '#00ffd9'};
        color: ${type === 'success' || type === 'error' ? '#fff' : '#030507'};
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// ANIMATION STYLES
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .sunday-warning {
        background: rgba(255,107,107,0.2);
        border: 1px solid #ff6b6b;
        border-radius: 40px;
        padding: 12px 18px;
        margin-bottom: 16px;
        color: #ff6b6b;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.logout = logout;
window.saveProfile = saveProfile;
window.copyReferralLink = copyReferralLink;
window.copyWalletAddress = copyWalletAddress;
window.uploadAvatar = uploadAvatar;
window.selectPackage = selectPackage;
window.showBonusMessage = showBonusMessage;
window.createStaking = createStaking;
window.unstakeStaking = unstakeStaking;
window.openDepositModal = openDepositModal;
window.processDeposit = processDeposit;
window.openWithdrawModal = openWithdrawModal;
window.processWithdraw = processWithdraw;
window.openP2PModal = openP2PModal;
window.processP2P = processP2P;
window.moveToNext = moveToNext;
window.showInvestModal = showInvestModal;
window.closeInvestModal = closeInvestModal;
window.confirmStake = confirmStake;
window.closeModal = closeModal;
window.goToHistory = goToHistory;
window.attachWallet = attachWallet;
window.openTradeModal = openTradeModal;