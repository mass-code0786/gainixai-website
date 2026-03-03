// ============================================
// DASHBOARD.JS - COMPLETE WITH REAL API INTEGRATION
// ============================================

// ============================================
// HELPER FUNCTIONS FOR SAFE ELEMENT UPDATES
// ============================================

function safeSetText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = value;
    } else {
        console.warn(`⚠️ Element not found: ${elementId}`);
    }
}

function safeSetValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    } else {
        console.warn(`⚠️ Element not found: ${elementId}`);
    }
}

function safeSetHtml(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
    } else {
        console.warn(`⚠️ Element not found: ${elementId}`);
    }
}

// ============================================
// DASHBOARD INITIALIZATION WITH REAL API DATA
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
        await loadActiveStakings();
        await loadLevelSummary();
        await loadRankInfo();
        await loadReferralSummary();
        await loadSalaryHistory();
        console.log('✅ Dashboard initialized successfully with real data');
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showToast('Failed to load some data. Please refresh.', 'error');
    }
});

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
// USER PROFILE FUNCTIONS (from localStorage)
// ============================================

async function loadUserProfile() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        console.warn('No user data in localStorage');
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        console.log('👤 Loading user profile:', user);
        
        safeSetValue('userName', user.name || 'User');
        safeSetText('userEmail', user.email || '');
        safeSetText('userId', user.userId || 'Gainix100001');
        safeSetText('fundWallet', `$${user.fundWallet || 0}`);
        safeSetText('withdrawWallet', `$${user.withdrawWallet || 0}`);
        safeSetText('totalStaked', `$${user.totalStaked || 0}`);
        safeSetText('stakingCount', user.stakingCount || '0');
        
        displayReferralLink(user);
        
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function displayReferralLink(user) {
    const userId = user.userId || 'Gainix100001';
    
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/Frontend/register.html?ref=${userId}`;
    
    const refLinkInput = document.getElementById('refLink');
    if (refLinkInput) {
        refLinkInput.value = referralLink;
    }
    
    const refLinkSpan = document.querySelector('.referral-link span');
    if (refLinkSpan) {
        refLinkSpan.textContent = `gainixai.live/ref/${userId}`;
    }
}

// ============================================
// STAKING FUNCTIONS - REAL API
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
            
            // Update wallet balances in localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.fundWallet = stats.fundWallet;
            user.withdrawWallet = stats.withdrawWallet;
            user.totalStaked = stats.totalStaked;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update UI wallets
            safeSetText('fundWallet', `$${stats.fundWallet || 0}`);
            safeSetText('withdrawWallet', `$${stats.withdrawWallet || 0}`);
        }
    } catch (error) {
        console.error('Failed to load staking stats:', error);
    }
}

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
                        <div class="staking-roi">
                            Daily ROI: $${s.dailyROI} (${s.dailyPercentage}%)
                        </div>
                        <div class="staking-dates">
                            <span>Start: ${new Date(s.startDate).toLocaleDateString()}</span>
                            <span>End: ${new Date(s.endDate).toLocaleDateString()}</span>
                        </div>
                        <div class="staking-days">
                            Days Left: ${s.daysLeft}
                        </div>
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
        const container = document.getElementById('activeStakingsList');
        if (container) {
            container.innerHTML = '<div class="error">Failed to load stakings</div>';
        }
    }
}

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
            
            // Reload all data
            await loadStakingStats();
            await loadActiveStakings();
            await loadReferralSummary();
            await loadRankInfo();
            
            // Clear input
            document.getElementById('packageAmount').value = '';
            document.getElementById('bonusMessage').innerHTML = '';
        }
    } catch (error) {
        showToast(error.message || 'Failed to create staking', 'error');
    }
}

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

function showBonusMessage() {
    const packageSelect = document.getElementById('packageSelect');
    const amount = parseFloat(document.getElementById('packageAmount')?.value) || 0;
    const msgDiv = document.getElementById('bonusMessage');
    
    if (msgDiv) {
        if (packageSelect && packageSelect.value === 'ELITE' && amount >= 500) {
            msgDiv.innerHTML = '🎉 You qualify for $100 instant bonus!';
            msgDiv.style.color = '#00ffd9';
        } else {
            msgDiv.innerHTML = '';
        }
    }
}

// ============================================
// LEVEL INCOME FUNCTIONS - REAL API
// ============================================

async function loadLevelSummary() {
    try {
        const result = await getLevelSummary();
        if (result?.success) {
            const levels = result.levels || [];
            const tbody = document.getElementById('levelIncomeBody');
            
            if (tbody) {
                let html = '';
                levels.forEach(level => {
                    html += `
                        <tr>
                            <td>Level ${level.level}</td>
                            <td>${level.percentage}%</td>
                            <td>$${level.todayEarned}</td>
                            <td class="${level.isUnlocked ? 'text-success' : 'text-muted'}">
                                ${level.unlockedStatus}
                            </td>
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
// SALARY RANK FUNCTIONS - REAL API
// ============================================

async function loadRankInfo() {
    try {
        const result = await getMyRank();
        if (result?.success) {
            const data = result.data;
            
            safeSetText('topCurrentRank', data.currentRank?.stars || '1 ⭐');
            safeSetText('currentRank', `${data.currentRank?.stars || '⭐'} Rank ${data.currentRank?.rank || 1}`);
            safeSetText('salaryCurrentRank', data.currentRank?.stars || '1 ⭐');
            
            if (data.nextRank) {
                safeSetText('directBusiness', `$${data.progress?.directVolume?.current || 0} / $${data.progress?.directVolume?.required || 0}`);
                safeSetText('teamBusiness', `$${data.progress?.teamVolume?.current || 0} / $${data.progress?.teamVolume?.required || 0}`);
                safeSetText('qualifiedDownlines', `${data.progress?.qualifiedMembers?.current || 0} / 2`);
                safeSetText('nextRank', `${data.nextRank.stars || '⭐⭐'} ($${data.nextRank.weeklySalary || 0}/week)`);
            }
            
            safeSetText('totalSalaryIncome', `$${data.totalSalaryEarned || 0}`);
        }
    } catch (error) {
        console.error('Failed to load rank info:', error);
    }
}

async function loadSalaryHistory() {
    try {
        const result = await getSalaryHistory();
        if (result?.success) {
            safeSetText('totalSalaryIncome', `$${result.data.totalSalaryEarned || 0}`);
            
            const rankResult = await getMyRank();
            if (rankResult?.success && rankResult.data.currentRank) {
                const weeklySalary = rankResult.data.currentRank.weeklySalary || 0;
                safeSetText('salaryIncomeToday', `+$${weeklySalary} this week`);
            }
        }
    } catch (error) {
        console.error('Failed to load salary history:', error);
    }
}

async function checkRankEligibility() {
    try {
        const result = await checkRankEligibility();
        if (result?.success) {
            if (result.rankChanged) {
                showToast('🎉 Congratulations! Rank upgraded!', 'success');
                await loadRankInfo();
            } else {
                showToast('✅ Rank check completed. No change.', 'info');
            }
        }
    } catch (error) {
        showToast(error.message || 'Failed to check rank', 'error');
    }
}

// ============================================
// REFERRAL FUNCTIONS - REAL API
// ============================================

async function loadReferralSummary() {
    try {
        const result = await getReferralSummary();
        if (result?.success) {
            const data = result.data;
            
            safeSetText('directIncome', `$${data.summary?.totalReferralEarned || 0}`);
            safeSetText('directCount', data.summary?.totalReferrals || '0');
            
            const membersContainer = document.getElementById('directMembersList');
            if (membersContainer && data.downlines) {
                if (data.downlines.length === 0) {
                    membersContainer.innerHTML = '<p class="no-data">No direct referrals yet</p>';
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
                                    <div>Staked: $${d.totalStaked || 0}</div>
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
// TEAM FUNCTIONS
// ============================================

async function showTeamLevel(level) {
    try {
        document.querySelectorAll('.team-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        const result = await getTeamByLevel(level);
        const container = document.getElementById('levelContents');
        
        if (!container) return;
        
        if (!result?.success || !result.data || result.data.length === 0) {
            container.innerHTML = '<p class="no-data">No members in this level</p>';
            return;
        }
        
        let html = '';
        result.data.forEach(member => {
            html += `
                <div class="member-item">
                    <div class="member-info">
                        <div class="member-avatar">${member.name ? member.name[0] : 'U'}</div>
                        <div class="member-details">
                            <div class="member-name">${member.name || 'Unknown'}</div>
                            <div class="member-id">${member.userId}</div>
                        </div>
                    </div>
                    <div class="member-contribution">$${member.contribution || 0}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Failed to load team:', error);
    }
}

async function searchLevel() {
    const input = document.getElementById('levelSearchInput');
    const level = parseInt(input?.value);
    
    if (level && level >= 1 && level <= 1000000) {
        await showTeamLevel(level);
    } else {
        showToast('Please enter a valid level (1-1000000)', 'error');
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function showInvestModal() {
    const modal = document.getElementById('investModal');
    if (modal) {
        modal.style.display = 'flex';
        showBonusMessage();
    }
}

function closeInvestModal() {
    const modal = document.getElementById('investModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function selectPackage(packageNum) {
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.getElementById(`package${packageNum}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    const packageSelect = document.getElementById('packageSelect');
    if (packageSelect) {
        const packages = ['BASIC', 'PRO', 'ELITE'];
        packageSelect.value = packages[packageNum - 1];
    }
    
    showBonusMessage();
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let bgColor, textColor;
    switch(type) {
        case 'success':
            bgColor = '#2ecc71';
            textColor = '#fff';
            break;
        case 'error':
            bgColor = '#ff6b6b';
            textColor = '#fff';
            break;
        default:
            bgColor = '#00ffd9';
            textColor = '#030507';
    }
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${textColor};
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
(function addToastStyles() {
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .text-success { color: #2ecc71; }
            .text-muted { color: #8899aa; }
            .no-data { text-align: center; padding: 40px; color: #8899aa; }
            .error { text-align: center; padding: 40px; color: #ff6b6b; }
            .sunday-warning {
                background: rgba(255,107,107,0.2);
                border: 1px solid #ff6b6b;
                border-radius: 40px;
                padding: 15px 25px;
                margin-bottom: 20px;
                color: #ff6b6b;
                display: flex;
                align-items: center;
                gap: 15px;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
})();

// ============================================
// COPY FUNCTIONS
// ============================================

function copyReferralLink() {
    const refLinkInput = document.getElementById('refLink');
    if (refLinkInput) {
        refLinkInput.select();
        document.execCommand('copy');
        showToast('✅ Referral link copied to clipboard!', 'success');
    }
}

function copyWalletAddress() {
    const walletDisplay = document.getElementById('walletAddressDisplay');
    if (walletDisplay) {
        const address = walletDisplay.innerText;
        navigator.clipboard.writeText(address);
        showToast('✅ Wallet address copied!', 'success');
    }
}

// ============================================
// LOGOUT FUNCTION
// ============================================

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ============================================
// WALLET FUNCTIONS
// ============================================

function openDepositModal() {
    showToast('Deposit feature coming soon', 'info');
}

function openWithdrawModal() {
    showToast('Withdraw feature coming soon', 'info');
}

function openP2PModal() {
    showToast('P2P transfer coming soon', 'info');
}

function openTradeModal() {
    showToast('Trading window opens at 9:00 UTC', 'info');
}

function attachWallet() {
    const address = document.getElementById('bep20Address')?.value;
    const pin = document.getElementById('walletPin')?.value;
    
    if (!address || address.length < 20) {
        showToast('Please enter a valid BEP20 address', 'error');
        return;
    }
    
    if (!pin || pin.length !== 4) {
        showToast('Please enter 4-digit PIN', 'error');
        return;
    }
    
    showToast('Wallet attached successfully!', 'success');
}

function uploadAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarIcon = document.getElementById('avatarIcon');
            const avatarImage = document.getElementById('avatarImage');
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (avatarImage) {
                avatarImage.style.display = 'block';
                avatarImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateUserName() {
    const newName = document.getElementById('userName')?.value;
    if (newName) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = newName;
        localStorage.setItem('user', JSON.stringify(user));
        showToast('Username updated!', 'success');
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================

function showDashboard() {
    window.location.href = 'dashboard.html';
}

function showSalaryPage() {
    window.location.href = 'salary.html';
}

function showTeamPage() {
    window.location.href = 'team.html';
}

function showP2PPage() {
    window.location.href = 'p2p.html';
}

function showHistoryPage() {
    window.location.href = 'history.html';
}

function showHistoryWithFilter(filter) {
    localStorage.setItem('historyFilter', filter);
    window.location.href = 'history.html';
}

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================

window.copyReferralLink = copyReferralLink;
window.copyWalletAddress = copyWalletAddress;
window.showInvestModal = showInvestModal;
window.closeInvestModal = closeInvestModal;
window.selectPackage = selectPackage;
window.createNewStaking = createNewStaking;
window.unstakeStaking = unstakeStaking;
window.showBonusMessage = showBonusMessage;
window.showTeamLevel = showTeamLevel;
window.searchLevel = searchLevel;
window.checkRankEligibility = checkRankEligibility;
window.logout = logout;
window.openDepositModal = openDepositModal;
window.openWithdrawModal = openWithdrawModal;
window.openP2PModal = openP2PModal;
window.openTradeModal = openTradeModal;
window.attachWallet = attachWallet;
window.uploadAvatar = uploadAvatar;
window.updateUserName = updateUserName;
window.showDashboard = showDashboard;
window.showSalaryPage = showSalaryPage;
window.showTeamPage = showTeamPage;
window.showP2PPage = showP2PPage;
window.showHistoryPage = showHistoryPage;
window.showHistoryWithFilter = showHistoryWithFilter;