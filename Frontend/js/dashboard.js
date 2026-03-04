// ============================================
// DASHBOARD INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing with real API data...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Check if Sunday
    checkSunday();

    // Load all data from APIs
    try {
        await loadUserProfile();
        await loadStakingStats();
        await loadActiveStakings();  // ✅ FIXED: was loadActiveTaskings
        await loadLevelSummary();
        await loadRankInfo();
        await loadReferralSummary();
        console.log('✅ Dashboard initialized successfully with real data');
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showToast('Failed to load some data. Please refresh.', 'error');
    }
});

// ============================================
// LOGOUT FUNCTION (for logo click)
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
        warningDiv.innerHTML = '<i class="fas fa-power-off"></i> ⚠️ Sunday - Bot Closed. No income will be generated today.';
        
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.prepend(warningDiv);
        }
    }
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
    const referralLink = `${baseUrl}/Frontend/register.html?ref=${userId}`;
    
    const refLinkInput = document.getElementById('refLink');
    if (refLinkInput) refLinkInput.value = referralLink;
    
    const refLinkSpan = document.getElementById('refLinkDisplay');
    if (refLinkSpan) refLinkSpan.innerText = `gainixai.live/ref/${userId}`;
}

// ============================================
// STAKING STATS - REAL API
// ============================================
async function loadStakingStats() {
    try {
        const result = await getStakingStats();
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

// ============================================
// ACTIVE STAKINGS - REAL API
// ============================================
async function loadActiveStakings() {
    try {
        const result = await getActiveStakings();
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

// ============================================
// LEVEL INCOME - REAL API
// ============================================
async function loadLevelSummary() {
    try {
        const result = await getLevelSummary();
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
// RANK INFO - REAL API
// ============================================
async function loadRankInfo() {
    try {
        const result = await getMyRank();
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
// REFERRAL SUMMARY - REAL API
// ============================================
async function loadReferralSummary() {
    try {
        const result = await getReferralSummary();
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
// CREATE NEW STAKING
// ============================================
async function createNewStaking() {
    const packageSelect = document.getElementById('packageSelect');
    const amount = document.getElementById('packageAmount').value;
    const referralId = document.getElementById('referralId')?.value || '';
    
    if (!amount || amount < 20) {
        showToast('Please enter a valid amount (minimum $20)', 'error');
        return;
    }

    try {
        const result = await createStaking(packageSelect.value, parseFloat(amount));
        if (result?.success) {
            showToast(result.message || 'Staking created successfully!', 'success');
            closeInvestModal();
            await loadStakingStats();
            await loadActiveStakings();
            await loadReferralSummary();
            await loadRankInfo();
            document.getElementById('packageAmount').value = '';
            document.getElementById('bonusMessage').innerHTML = '';
        }
    } catch (error) {
        showToast(error.message || 'Failed to create staking', 'error');
    }
}

// ============================================
// UNSTAKE STAKING
// ============================================
async function unstakeStaking(stakingId) {
    if (!confirm('Are you sure you want to unstake this position?')) return;
    
    try {
        const result = await unstakeStaking(stakingId);
        if (result?.success) {
            showToast('✅ Staking unstaked successfully!', 'success');
            await loadActiveStakings();
            await loadStakingStats();
        }
    } catch (error) {
        showToast(error.message || 'Failed to unstake', 'error');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function safeSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function safeSetValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
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
        const packages = ['BASIC', 'PRO', 'ELITE'];
        select.value = packages[num - 1];
    }
    showBonusMessage();
}

function showInvestModal() {
    document.getElementById('investModal').style.display = 'flex';
    showBonusMessage();
}

function closeInvestModal() {
    document.getElementById('investModal').style.display = 'none';
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
`;
document.head.appendChild(style);

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.logout = logout;
window.selectPackage = selectPackage;
window.showBonusMessage = showBonusMessage;
window.showInvestModal = showInvestModal;
window.closeInvestModal = closeInvestModal;
window.createNewStaking = createNewStaking;
window.unstakeStaking = unstakeStaking;