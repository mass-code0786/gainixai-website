// ============================================
// GLOBAL CONFIGURATION
// ============================================
const API_BASE_URL = 'https://gainixai-backend.onrender.com/api';

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing...');
    
    const token = localStorage.getItem('token');
    if (!token) {
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
        console.log('✅ Dashboard initialized');
    } catch (error) {
        console.error('❌ Dashboard error:', error);
    }
});

// ============================================
// LOGOUT FUNCTION
// ============================================
function logout() {
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
        warningDiv.innerHTML = '<i class="fas fa-power-off"></i> ⚠️ Sunday - Bot Closed. No income generated.';
        document.querySelector('.dashboard')?.prepend(warningDiv);
    }
}

// ============================================
// UTC TIME UPDATE
// ============================================
function updateUTCTime() {
    const now = new Date();
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    document.getElementById('utcDisplay').innerText = hours + ':' + minutes + ' UTC';
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
// STAKING FUNCTIONS
// ============================================
async function loadStakingStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/staking/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
        if (result?.success) {
            const stats = result.data.summary;
            safeSetText('totalStaked', `$${stats.totalStaked || 0}`);
            safeSetText('stakingCount', stats.activeStakings || '0');
            safeSetText('stakingIncome', `$${stats.totalROIEarned || 0}`);
            safeSetText('stakingIncomeToday', `+$${stats.totalDailyROI || 0} today`);
            safeSetText('fundWallet', `$${stats.fundWallet || 0}`);
            safeSetText('withdrawWallet', `$${stats.withdrawWallet || 0}`);
        }
    } catch (error) {
        console.error('Failed to load staking stats:', error);
    }
}

async function loadActiveStakings() {
    try {
        const response = await fetch(`${API_BASE_URL}/staking/active`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
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
        const response = await fetch(`${API_BASE_URL}/staking/unstake/${stakingId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
        if (result?.success) {
            showToast('✅ Staking unstaked successfully!', 'success');
            await loadActiveStakings();
            await loadStakingStats();
        }
    } catch (error) {
        showToast('Failed to unstake', 'error');
    }
}

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
        const response = await fetch(`${API_BASE_URL}/staking/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                package: packageSelect.value,
                amount: parseFloat(amount)
            })
        });
        const result = await response.json();
        
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
// LEVEL INCOME FUNCTIONS
// ============================================
async function loadLevelSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/level/summary`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
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
// RANK FUNCTIONS
// ============================================
async function loadRankInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/salary/my-rank`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
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
        }
    } catch (error) {
        console.error('Failed to load rank info:', error);
    }
}

// ============================================
// REFERRAL FUNCTIONS
// ============================================
async function loadReferralSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/referral/summary`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
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
// WITHDRAWAL FUNCTIONS - FIXED WITH CORRECT URL
// ============================================
function openWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'flex';
}

async function processWithdraw() {
    const amount = document.getElementById('withdrawAmount').value;
    const walletAddress = document.getElementById('withdrawWalletAddress').value;
    const token = localStorage.getItem('token');

    if (!amount || amount < 20) {
        showToast('Minimum withdrawal is $20', 'error');
        return;
    }

    if (!walletAddress || walletAddress.length < 10) {
        showToast('Please enter a valid wallet address', 'error');
        return;
    }

    try {
        console.log('Sending withdrawal request to:', `${API_BASE_URL}/withdrawal/create`);
        
        const response = await fetch(`${API_BASE_URL}/withdrawal/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                walletAddress: walletAddress
            })
        });

        const data = await response.json();
        console.log('Withdrawal response:', data);

        if (data.success) {
            showToast(`✅ Withdrawal request submitted!`, 'success');
            closeModal('withdrawModal');
            await loadStakingStats(); // Refresh wallet balance
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawWalletAddress').value = '';
        } else {
            showToast(`❌ ${data.message || 'Withdrawal failed'}`, 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast('❌ Network error. Please try again.', 'error');
    }
}

// ============================================
// DEPOSIT FUNCTIONS
// ============================================
function openDepositModal() {
    document.getElementById('depositModal').style.display = 'flex';
}

async function processDeposit() {
    const amount = document.getElementById('depositAmount').value;
    
    if (!amount || amount < 20) {
        showToast('Minimum deposit is $20', 'error');
        return;
    }

    showToast('Deposit feature coming soon', 'info');
    closeModal('depositModal');
}

// ============================================
// P2P FUNCTIONS
// ============================================
function openP2PModal() {
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

    showToast('P2P feature coming soon', 'info');
    closeModal('p2pModal');
}

// ============================================
// INVEST MODAL FUNCTIONS
// ============================================
function showInvestModal() {
    document.getElementById('investModal').style.display = 'flex';
    showBonusMessage();
}

function closeInvestModal() {
    document.getElementById('investModal').style.display = 'none';
}

function confirmStake() {
    showToast('Staking confirmed!', 'success');
    closeInvestModal();
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

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
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
    showToast('Wallet attached!', 'success');
}

function openTradeModal() {
    showToast('Trading window opens at 9:00 UTC', 'info');
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

// Add animation styles
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

// Export functions to global scope
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