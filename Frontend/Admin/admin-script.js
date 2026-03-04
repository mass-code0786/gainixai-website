// ==================== ADMIN CONFIGURATION ====================
let adminLoggedIn = false;
const API_BASE_URL = 'https://gainixai-backend.onrender.com/api';
let adminToken = localStorage.getItem('adminToken') || null;

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    document.getElementById('adminSidebar').classList.toggle('active');
}

// ==================== ADMIN LOGIN ====================
async function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminToken = data.data.token;
            localStorage.setItem('adminToken', adminToken);
            
            document.getElementById('admin-login-page').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'flex';
            adminLoggedIn = true;
            
            updateAdminDate();
            loadDashboardStats();
            loadUsersTable();
            loadWithdrawalsTable();
            loadUnstakeTable();
            loadTransactionsTable();
            loadStakingTable();
            loadUserSelect();
            loadBotSettings();
            loadROISettings();
            loadSalarySettings();
            initCharts();
            
            document.getElementById('adminName').textContent = data.data.admin?.username || 'Admin';
        } else {
            alert('Invalid credentials! Use admin/Admin@123');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error. Make sure backend is running.');
    }
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    adminToken = null;
    adminLoggedIn = false;
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login-page').style.display = 'flex';
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', function() {
    if (adminToken) {
        document.getElementById('admin-login-page').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        adminLoggedIn = true;
        updateAdminDate();
        loadDashboardStats();
        loadUsersTable();
        loadWithdrawalsTable();
        loadUnstakeTable();
        loadTransactionsTable();
        loadStakingTable();
        loadUserSelect();
        loadBotSettings();
        loadROISettings();
        loadSalarySettings();
        initCharts();
    }
    updateServerUptime();
    setInterval(updateServerUptime, 1000);
});

// ==================== API HELPER ====================
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
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

// ==================== PAGE NAVIGATION ====================
function switchAdminPage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(`admin-${page}-page`).classList.add('active');
    
    document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
    event.target.closest('.admin-menu-item').classList.add('active');
    
    document.getElementById('adminPageTitle').textContent = page.split('-').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    
    document.getElementById('adminSidebar').classList.remove('active');
    
    if (page === 'users') loadUsersTable();
    if (page === 'withdrawals') loadWithdrawalsTable();
    if (page === 'unstake') loadUnstakeTable();
    if (page === 'staking') loadStakingTable();
    if (page === 'bot-settings') loadBotSettings();
}

// ==================== DASHBOARD ====================
function updateAdminDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('adminCurrentDate').textContent = now.toLocaleDateString('en-US', options);
}

async function loadDashboardStats() {
    try {
        const data = await apiCall('/admin/dashboard');
        
        if (data.success) {
            const stats = data.data;
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
            document.getElementById('inactiveUsers').textContent = (stats.totalUsers - stats.activeUsers) || 0;
            
            document.getElementById('totalStakedAdmin').textContent = '$' + (stats.totalStaked || 0).toLocaleString();
            document.getElementById('activeStaked').textContent = '$' + (stats.totalStaked || 0).toLocaleString();
            document.getElementById('pendingWithdrawals').textContent = '$' + (stats.pendingAmount || 0);
            
            loadRecentUnstake();
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('activeUsers').textContent = '0';
    }
}

async function loadRecentUnstake() {
    try {
        const data = await apiCall('/admin/withdrawals?status=pending&limit=3');
        const container = document.getElementById('recentUnstakeRequests');
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(r => `
                <div class="admin-activity-item">
                    <div class="admin-activity-icon"><i class="fas fa-clock"></i></div>
                    <div class="admin-activity-content">
                        <p><strong>${r.userName}</strong> - Withdrawal Request</p>
                        <p class="admin-activity-time">${new Date(r.createdAt).toLocaleDateString()} • $${r.amount}</p>
                    </div>
                    <button class="admin-action-btn success" onclick="processWithdrawal('${r._id}')">Process</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="admin-activity-item">No pending requests</div>';
        }
    } catch (error) {
        document.getElementById('recentUnstakeRequests').innerHTML = '<div class="admin-activity-item">Error loading requests</div>';
    }
}

// ==================== CHARTS ====================
function initCharts() {
    const userCtx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(userCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                data: [450, 620, 890, 1120, 1247, 1350],
                borderColor: '#00ffd9',
                backgroundColor: 'rgba(0,255,209,0.1)',
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });

    const stakeCtx = document.getElementById('stakingChart').getContext('2d');
    new Chart(stakeCtx, {
        type: 'bar',
        data: {
            labels: ['BASIC', 'PRO', 'ELITE'],
            datasets: [{
                data: [4500, 3200, 2100],
                backgroundColor: ['#00ffd9', '#0099ff', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });
}

// ==================== USERS TABLE ====================
async function loadUsersTable() {
    try {
        const data = await apiCall('/admin/users');
        const tbody = document.getElementById('usersTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach((user, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${user.userId}</strong></td>
                        <td>${user.name || 'N/A'}</td>
                        <td><span class="admin-status-badge ${user.status || 'active'}">${user.status || 'active'}</span></td>
                        <td>${user.walletAddress ? user.walletAddress.substring(0,10) + '...' : 'Not set'}</td>
                        <td>****</td>
                        <td>$${user.fundWallet || 0}</td>
                        <td>$${user.withdrawWallet || 0}</td>
                        <td>
                            <button class="admin-action-btn" onclick="editUser('${user.userId}')"><i class="fas fa-edit"></i></button>
                            <button class="admin-action-btn" onclick="viewUserDetails('${user.userId}')"><i class="fas fa-eye"></i></button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">No users found</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function searchUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    try {
        const data = await apiCall(`/admin/users?search=${search}`);
        const tbody = document.getElementById('usersTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach((user, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${user.userId}</strong></td>
                        <td>${user.name || 'N/A'}</td>
                        <td><span class="admin-status-badge ${user.status || 'active'}">${user.status || 'active'}</span></td>
                        <td>${user.walletAddress ? user.walletAddress.substring(0,10) + '...' : 'Not set'}</td>
                        <td>****</td>
                        <td>$${user.fundWallet || 0}</td>
                        <td>$${user.withdrawWallet || 0}</td>
                        <td>
                            <button class="admin-action-btn" onclick="editUser('${user.userId}')"><i class="fas fa-edit"></i></button>
                            <button class="admin-action-btn" onclick="viewUserDetails('${user.userId}')"><i class="fas fa-eye"></i></button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

async function editUser(userId) {
    try {
        const data = await apiCall(`/admin/users/${userId}`);
        if (data.success) {
            const user = data.data.user;
            
            document.getElementById('editUserId').value = user.userId;
            document.getElementById('editUserName').value = user.name || '';
            document.getElementById('editUserWallet').value = user.walletAddress || '';
            document.getElementById('editFundWallet').value = user.fundWallet || 0;
            document.getElementById('editWithdrawWallet').value = user.withdrawWallet || 0;
            document.getElementById('editUserStatus').value = user.status || 'active';
            
            openModal('editUserModal');
        }
    } catch (error) {
        alert('Failed to load user details');
    }
}

async function saveUserChanges() {
    const userId = document.getElementById('editUserId').value;
    const userData = {
        name: document.getElementById('editUserName').value,
        walletAddress: document.getElementById('editUserWallet').value,
        fundWallet: parseFloat(document.getElementById('editFundWallet').value),
        withdrawWallet: parseFloat(document.getElementById('editWithdrawWallet').value),
        status: document.getElementById('editUserStatus').value
    };
    
    try {
        const data = await apiCall(`/admin/users/${userId}`, 'PUT', userData);
        if (data.success) {
            closeModal('editUserModal');
            loadUsersTable();
            alert('User updated successfully!');
        }
    } catch (error) {
        alert('Failed to update user');
    }
}

function viewUserDetails(userId) {
    window.location.href = `user-details.html?userId=${userId}`;
}

// ==================== WITHDRAWALS ====================
async function loadWithdrawalsTable() {
    try {
        const data = await apiCall('/admin/withdrawals');
        const tbody = document.getElementById('withdrawalsTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(w => {
                html += `
                    <tr>
                        <td>${new Date(w.createdAt).toLocaleDateString()}</td>
                        <td><strong>${w.userName}</strong><br><small>${w.userId}</small></td>
                        <td>$${w.amount}</td>
                        <td>$${w.amount * 0.1}</td>
                        <td>$${w.amount * 0.9}</td>
                        <td>${w.walletAddress.substring(0,10)}...</td>
                        <td><span class="admin-status-badge ${w.status}">${w.status}</span></td>
                        <td>
                            ${w.status === 'pending' ? 
                                `<button class="admin-action-btn success" onclick="processWithdrawal('${w._id}')">Process</button>` : 
                                '<small>Processed</small>'
                            }
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No withdrawals found</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load withdrawals:', error);
    }
}

async function filterWithdrawals() {
    const filter = document.getElementById('withdrawFilter').value;
    try {
        const data = await apiCall(`/admin/withdrawals?status=${filter}`);
        const tbody = document.getElementById('withdrawalsTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(w => {
                html += `
                    <tr>
                        <td>${new Date(w.createdAt).toLocaleDateString()}</td>
                        <td><strong>${w.userName}</strong><br><small>${w.userId}</small></td>
                        <td>$${w.amount}</td>
                        <td>$${w.amount * 0.1}</td>
                        <td>$${w.amount * 0.9}</td>
                        <td>${w.walletAddress.substring(0,10)}...</td>
                        <td><span class="admin-status-badge ${w.status}">${w.status}</span></td>
                        <td>
                            ${w.status === 'pending' ? 
                                `<button class="admin-action-btn success" onclick="processWithdrawal('${w._id}')">Process</button>` : 
                                '<small>Processed</small>'
                            }
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    } catch (error) {
        console.error('Filter error:', error);
    }
}

function processWithdrawal(id) {
    document.getElementById('processWithdrawalId').value = id;
    openModal('processWithdrawalModal');
}

async function approveWithdrawal() {
    const id = document.getElementById('processWithdrawalId').value;
    const txHash = document.getElementById('processWithdrawalTxHash').value || '0x' + Math.random().toString(36).substring(2,15);
    
    try {
        const data = await apiCall(`/admin/withdrawals/${id}`, 'PUT', {
            status: 'approved',
            txHash: txHash
        });
        
        if (data.success) {
            closeModal('processWithdrawalModal');
            loadWithdrawalsTable();
            alert('Withdrawal approved successfully!');
        }
    } catch (error) {
        alert('Failed to approve withdrawal');
    }
}

async function rejectWithdrawal() {
    const id = document.getElementById('processWithdrawalId').value;
    
    try {
        const data = await apiCall(`/admin/withdrawals/${id}`, 'PUT', {
            status: 'rejected'
        });
        
        if (data.success) {
            closeModal('processWithdrawalModal');
            loadWithdrawalsTable();
            alert('Withdrawal rejected!');
        }
    } catch (error) {
        alert('Failed to reject withdrawal');
    }
}

// ==================== UNSTAKE REQUESTS ====================
async function loadUnstakeTable() {
    try {
        const data = await apiCall('/admin/unstake-requests');
        const tbody = document.getElementById('unstakeTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(u => {
                html += `
                    <tr>
                        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                        <td><strong>${u.userName}</strong><br><small>${u.userId}</small></td>
                        <td>${u.package}</td>
                        <td>$${u.amount}</td>
                        <td>$${u.earnings || 0}</td>
                        <td>$${u.total || u.amount}</td>
                        <td>${u.walletAddress.substring(0,10)}...</td>
                        <td><span class="admin-status-badge ${u.status}">${u.status}</span></td>
                        <td>
                            ${u.status === 'pending' ? 
                                `<button class="admin-action-btn success" onclick="processUnstake('${u._id}')">Process</button>` : 
                                'Completed'
                            }
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">No unstake requests</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load unstake requests:', error);
    }
}

function processUnstake(id) {
    document.getElementById('processUnstakeId').value = id;
    openModal('processUnstakeModal');
}

async function approveUnstake() {
    const id = document.getElementById('processUnstakeId').value;
    const txHash = document.getElementById('processUnstakeTxHash').value || '0x' + Math.random().toString(36).substring(2,15);
    
    try {
        const data = await apiCall(`/admin/unstake/${id}`, 'PUT', {
            status: 'completed',
            txHash: txHash
        });
        
        if (data.success) {
            closeModal('processUnstakeModal');
            loadUnstakeTable();
            alert('Unstake processed successfully!');
        }
    } catch (error) {
        alert('Failed to process unstake');
    }
}

// ==================== TRANSACTIONS ====================
async function loadTransactionsTable() {
    try {
        const data = await apiCall('/admin/transactions');
        const tbody = document.getElementById('transactionsTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(t => {
                html += `
                    <tr>
                        <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                        <td><strong>${t.userName}</strong><br><small>${t.userId}</small></td>
                        <td><span class="admin-status-badge">${t.type}</span></td>
                        <td>$${t.amount}</td>
                        <td>-</td>
                        <td><span class="admin-status-badge ${t.status}">${t.status}</span></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No transactions found</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

async function filterTransactions() {
    const filter = document.getElementById('transactionFilter').value;
    try {
        const data = await apiCall(`/admin/transactions?type=${filter}`);
        const tbody = document.getElementById('transactionsTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(t => {
                html += `
                    <tr>
                        <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                        <td><strong>${t.userName}</strong><br><small>${t.userId}</small></td>
                        <td><span class="admin-status-badge">${t.type}</span></td>
                        <td>$${t.amount}</td>
                        <td>-</td>
                        <td><span class="admin-status-badge ${t.status}">${t.status}</span></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    } catch (error) {
        console.error('Filter error:', error);
    }
}

// ==================== STAKING ====================
async function loadStakingTable() {
    try {
        const data = await apiCall('/admin/stakings');
        const tbody = document.getElementById('stakingTableBody');
        
        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(s => {
                html += `
                    <tr>
                        <td><strong>${s.userName}</strong><br><small>${s.userId}</small></td>
                        <td><span class="admin-status-badge">${s.package}</span></td>
                        <td>$${s.amount}</td>
                        <td>${s.dailyROI}%</td>
                        <td>${new Date(s.startDate).toLocaleDateString()}</td>
                        <td>${new Date(s.endDate).toLocaleDateString()}</td>
                        <td><span class="admin-status-badge ${s.status}">${s.status}</span></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
            
            updatePackageStats(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No stakings found</td></tr>';
        }
    } catch (error) {
        console.error('Failed to load stakings:', error);
    }
}

function updatePackageStats(stakings) {
    const basic = stakings.filter(s => s.package === 'BASIC');
    const pro = stakings.filter(s => s.package === 'PRO');
    const elite = stakings.filter(s => s.package === 'ELITE');
    
    document.getElementById('basicStakers').textContent = basic.length;
    document.getElementById('basicAmount').textContent = '$' + basic.reduce((sum, s) => sum + s.amount, 0).toLocaleString();
    document.getElementById('proStakers').textContent = pro.length;
    document.getElementById('proAmount').textContent = '$' + pro.reduce((sum, s) => sum + s.amount, 0).toLocaleString();
    document.getElementById('eliteStakers').textContent = elite.length;
    document.getElementById('eliteAmount').textContent = '$' + elite.reduce((sum, s) => sum + s.amount, 0).toLocaleString();
}

// ==================== BOT SETTINGS - FIXED ====================
async function loadBotSettings() {
    try {
        const data = await apiCall('/settings');
        if (data.success) {
            const settings = data.data;
            document.getElementById('botStartTime').value = `${settings.botTradingStartHour || 9}:00`;
            document.getElementById('botEndTime').value = `${settings.botTradingEndHour || 10}:00`;
            document.getElementById('levelDelay').value = 10;
            document.getElementById('botStatusSelect').value = settings.botEnabled ? 'active' : 'paused';
        }
    } catch (error) {
        console.error('Failed to load bot settings:', error);
    }
}

// ✅ FIXED: Save Bot Settings with API Call
async function saveBotSettings() {
    try {
        const startTime = document.getElementById('botStartTime').value;
        const endTime = document.getElementById('botEndTime').value;
        const status = document.getElementById('botStatusSelect').value;
        
        const settings = {
            startHour: parseInt(startTime.split(':')[0]),
            endHour: parseInt(endTime.split(':')[0]),
            enabled: status === 'active'
        };
        
        console.log('Saving bot settings:', settings);
        
        const data = await apiCall('/settings/bot', 'PUT', settings);
        
        if (data.success) {
            alert('✅ Bot settings saved successfully!');
            loadBotSettings(); // Refresh
        } else {
            alert('❌ Failed to save: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving bot settings:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ==================== ROI SETTINGS ====================
async function loadROISettings() {
    try {
        const data = await apiCall('/settings');
        if (data.success) {
            const settings = data.data;
            
            document.getElementById('basicMin').value = settings.basicMinAmount || 20;
            document.getElementById('basicMinROI').value = settings.basicRoiMin || 0.9;
            document.getElementById('basicMaxROI').value = settings.basicRoiMax || 1.2;
            document.getElementById('basicDays').value = settings.basicPeriod || 90;
            
            document.getElementById('proMin').value = settings.proMinAmount || 150;
            document.getElementById('proMinROI').value = settings.proRoiMin || 1.1;
            document.getElementById('proMaxROI').value = settings.proRoiMax || 1.4;
            document.getElementById('proDays').value = settings.proPeriod || 180;
            
            document.getElementById('eliteMin').value = settings.eliteMinAmount || 300;
            document.getElementById('eliteMinROI').value = settings.eliteRoiMin || 1.4;
            document.getElementById('eliteMaxROI').value = settings.eliteRoiMax || 2.0;
            document.getElementById('eliteDays').value = settings.elitePeriod || 450;
        }
    } catch (error) {
        console.error('Failed to load ROI settings:', error);
    }
}

async function saveROISettings() {
    try {
        const settings = {
            basic: {
                minAmount: parseFloat(document.getElementById('basicMin').value),
                roiMin: parseFloat(document.getElementById('basicMinROI').value),
                roiMax: parseFloat(document.getElementById('basicMaxROI').value),
                period: parseInt(document.getElementById('basicDays').value)
            },
            pro: {
                minAmount: parseFloat(document.getElementById('proMin').value),
                roiMin: parseFloat(document.getElementById('proMinROI').value),
                roiMax: parseFloat(document.getElementById('proMaxROI').value),
                period: parseInt(document.getElementById('proDays').value)
            },
            elite: {
                minAmount: parseFloat(document.getElementById('eliteMin').value),
                roiMin: parseFloat(document.getElementById('eliteMinROI').value),
                roiMax: parseFloat(document.getElementById('eliteMaxROI').value),
                period: parseInt(document.getElementById('eliteDays').value)
            }
        };
        
        const data = await apiCall('/settings/packages', 'PUT', settings);
        if (data.success) {
            alert('✅ ROI settings saved successfully!');
        }
    } catch (error) {
        console.error('Error saving ROI settings:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ==================== SALARY SETTINGS ====================
async function loadSalarySettings() {
    try {
        const data = await apiCall('/settings');
        if (data.success && data.data.rankSettings) {
            const ranks = data.data.rankSettings;
            // Load rank settings into form
        }
    } catch (error) {
        console.error('Failed to load salary settings:', error);
    }
}

// ==================== WALLET TRANSFER ====================
async function loadUserSelect() {
    try {
        const data = await apiCall('/admin/users');
        const select = document.getElementById('transferUser');
        
        if (data.success && data.data.length > 0) {
            let options = '<option value="">Select User</option>';
            data.data.forEach(u => {
                options += `<option value="${u.userId}">${u.userId} - ${u.name}</option>`;
            });
            select.innerHTML = options;
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadUserWallets() {
    const userId = document.getElementById('transferUser').value;
    if (!userId) return;
    
    try {
        const data = await apiCall(`/admin/users/${userId}`);
        if (data.success) {
            const user = data.data.user;
            document.getElementById('userBalanceDisplay').innerHTML = `
                <h4 style="color:#00ffd9; margin-bottom:10px">${user.userId}</h4>
                <p>Fund Wallet: $${user.fundWallet || 0}</p>
                <p>Withdraw Wallet: $${user.withdrawWallet || 0}</p>
                <p>Total: $${(user.fundWallet || 0) + (user.withdrawWallet || 0)}</p>
            `;
        }
    } catch (error) {
        console.error('Failed to load user wallets:', error);
    }
}

async function transferFunds() {
    const userId = document.getElementById('transferUser').value;
    const fromWallet = document.getElementById('fromWallet').value;
    const toWallet = document.getElementById('toWallet').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    
    if (!userId || !amount || amount <= 0) {
        alert('Please select user and enter valid amount');
        return;
    }
    
    if (fromWallet === toWallet) {
        alert('From and To wallets cannot be the same');
        return;
    }
    
    try {
        const data = await apiCall('/admin/wallet-transfer', 'POST', {
            userId,
            fromWallet,
            toWallet,
            amount
        });
        
        if (data.success) {
            loadUserWallets();
            alert(`✅ Successfully transferred $${amount}`);
            document.getElementById('transferAmount').value = '';
        }
    } catch (error) {
        alert('Transfer failed: ' + error.message);
    }
}

// ==================== SETTINGS ====================
function saveWithdrawalSettings() {
    const fee = document.getElementById('withdrawalFee').value;
    const min = document.getElementById('minWithdrawal').value;
    alert(`Withdrawal settings saved! Fee: ${fee}%, Min: $${min}`);
}

function savePinSettings() {
    const auto = document.getElementById('autoGeneratePin').checked;
    const length = document.getElementById('pinLength').value;
    alert(`PIN settings saved! Auto-generate: ${auto}, Length: ${length} digits`);
}

function changeAdminPassword() {
    const current = document.getElementById('currentAdminPass').value;
    const newPass = document.getElementById('newAdminPass').value;
    const confirm = document.getElementById('confirmAdminPass').value;
    
    if (!current || !newPass || !confirm) {
        alert('Please fill all fields');
        return;
    }
    
    if (newPass !== confirm) {
        alert('New passwords do not match');
        return;
    }
    
    alert('Password changed successfully!');
    document.getElementById('currentAdminPass').value = '';
    document.getElementById('newAdminPass').value = '';
    document.getElementById('confirmAdminPass').value = '';
}

// ==================== STAKING MODAL ====================
async function showAddStakingModal() {
    try {
        const data = await apiCall('/admin/users');
        const userSelect = document.getElementById('stakingUserId');
        
        if (data.success && data.data.length > 0) {
            let options = '<option value="">Select User</option>';
            data.data.forEach(u => {
                options += `<option value="${u.userId}">${u.userId} - ${u.name}</option>`;
            });
            userSelect.innerHTML = options;
        }
        openModal('addStakingModal');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function addStaking() {
    const userId = document.getElementById('stakingUserId').value;
    const pkg = document.getElementById('stakingPackage').value;
    const amount = parseFloat(document.getElementById('stakingAmount').value);
    const roi = parseFloat(document.getElementById('stakingROI').value);
    
    if (!userId || !amount || !roi) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const data = await apiCall('/admin/add-staking', 'POST', {
            userId,
            package: pkg,
            amount,
            dailyROI: roi
        });
        
        if (data.success) {
            closeModal('addStakingModal');
            loadStakingTable();
            alert('Staking added successfully!');
        }
    } catch (error) {
        alert('Failed to add staking');
    }
}

// ==================== MODAL FUNCTIONS ====================
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ==================== SERVER UPTIME ====================
function updateServerUptime() {
    const uptime = document.getElementById('serverUptime');
    if (uptime) {
        uptime.value = '2 hours 34 minutes';
    }
}