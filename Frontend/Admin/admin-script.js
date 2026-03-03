// ==================== ADMIN CONFIGURATION ====================
let adminLoggedIn = false;
let apiBaseUrl = 'http://localhost:5000/api'; // Backend API URL

// Sample Data (for demo)
let users = [
    { id: 1, userId: 'Gainix100001', name: 'Admin User', password: 'admin123', pin: '1234', status: 'active', 
      walletAddress: '0x5f3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a', 
      fundWallet: 5000, withdrawWallet: 2345, totalStaked: 2500, joined: '2024-01-01' },
    { id: 2, userId: 'Gainix100002', name: 'Alice Johnson', password: 'pass123', pin: '5678', status: 'active',
      walletAddress: '0x7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      fundWallet: 2000, withdrawWallet: 450, totalStaked: 1200, joined: '2024-01-05' },
    { id: 3, userId: 'Gainix100003', name: 'Bob Smith', password: 'bob123', pin: '9012', status: 'active',
      walletAddress: '0x9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
      fundWallet: 1500, withdrawWallet: 320, totalStaked: 850, joined: '2024-01-07' }
];

let transactions = [
    { id: 1, date: '2024-01-15', time: '10:30', userId: 'Gainix100001', userName: 'Admin User', type: 'staking', amount: 500, status: 'completed' },
    { id: 2, date: '2024-01-15', time: '09:45', userId: 'Gainix100002', userName: 'Alice Johnson', type: 'deposit', amount: 1000, status: 'completed' }
];

let withdrawals = [
    { id: 1, date: '2024-01-14', userId: 'Gainix100003', userName: 'Bob Smith', amount: 100, fee: 10, netAmount: 90, wallet: '0x9d4e...2c3b', status: 'pending', txHash: '' }
];

let unstakeRequests = [
    { id: 1, date: '2024-01-12', userId: 'Gainix100002', userName: 'Alice Johnson', package: 'PRO', amount: 1200, earnings: 85, total: 1285, wallet: '0x7b2c...f1a', status: 'pending' }
];

let stakings = [
    { id: 1, userId: 'Gainix100001', userName: 'Admin User', package: 'BASIC', amount: 500, dailyROI: 0.9, startDate: '2024-01-01', endDate: '2024-03-31', status: 'active' }
];

// Bot Settings
let botSettings = {
    startTime: '09:00',
    endTime: '10:00',
    levelDelay: 10,
    status: 'active',
    totalTrades: 1247,
    winRate: 78,
    totalProfit: 3250
};

// ROI Settings
let roisettings = {
    basic: { min: 20, minROI: 0.9, maxROI: 1.2, days: 90 },
    pro: { min: 150, minROI: 1.1, maxROI: 1.4, days: 180 },
    elite: { min: 300, minROI: 1.4, maxROI: 2.0, days: 450 }
};

// Salary Settings
let salarySettings = {
    rank1: { direct: 1000, team: 2500, salary: 8 },
    rank2: { direct: 1500, team: 10000, salary: 30 },
    rank3: { direct: 2000, team: 30000, salary: 60 },
    rank4: { direct: 2500, team: 100000, salary: 200 },
    rank5: { direct: 3000, team: 300000, salary: 500 },
    rank6: { direct: 5000, team: 1000000, salary: 1000 }
};

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    document.getElementById('adminSidebar').classList.toggle('active');
}

// ==================== ADMIN LOGIN ====================
async function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Demo login (bypass API for now)
    if (username === 'admin' && password === 'admin123') {
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
        
        document.getElementById('adminName').textContent = 'Admin';
    } else {
        alert('Invalid credentials! Use admin/admin123');
    }
    
    // Real API call (commented for now)
    /*
    try {
        const response = await fetch(`${apiBaseUrl}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('admin-login-page').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'flex';
            adminLoggedIn = true;
            updateAdminDate();
            loadDashboardStats();
            // ... load other data
        } else {
            alert(data.message || 'Invalid credentials');
        }
    } catch (error) {
        alert('Network error. Make sure backend is running.');
    }
    */
}

function adminLogout() {
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login-page').style.display = 'flex';
    adminLoggedIn = false;
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
    
    // Close mobile menu
    document.getElementById('adminSidebar').classList.remove('active');
}

// ==================== DASHBOARD ====================
function updateAdminDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('adminCurrentDate').textContent = now.toLocaleDateString('en-US', options);
}

function loadDashboardStats() {
    // Update stats with sample data
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('activeUsers').textContent = users.filter(u => u.status === 'active').length;
    document.getElementById('inactiveUsers').textContent = users.filter(u => u.status !== 'active').length;
    document.getElementById('userChange').textContent = '+3 this week';
    
    document.getElementById('totalStakedAdmin').textContent = '$12,450';
    document.getElementById('stakedChange').textContent = '+$1,240 today';
    document.getElementById('activeStaked').textContent = '$10,200';
    document.getElementById('unstakedTotal').textContent = '$2,250';
    
    document.getElementById('totalWithdrawn').textContent = '$5,670';
    document.getElementById('withdrawChange').textContent = '+$450 today';
    document.getElementById('pendingWithdrawals').textContent = '$890';
    
    document.getElementById('botStatus').textContent = 'Active';
    document.getElementById('botWindow').textContent = '9:00-10:00 UTC';
    
    // Load recent unstake requests
    const recentUnstake = document.getElementById('recentUnstakeRequests');
    if (unstakeRequests.length > 0) {
        recentUnstake.innerHTML = unstakeRequests.filter(r => r.status === 'pending').slice(0, 3).map(r => `
            <div class="admin-activity-item">
                <div class="admin-activity-icon"><i class="fas fa-clock"></i></div>
                <div class="admin-activity-content">
                    <p><strong>${r.userName}</strong> - Unstake Request</p>
                    <p class="admin-activity-time">${r.date} • $${r.total}</p>
                </div>
                <button class="admin-action-btn success" onclick="processUnstake(${r.id})">Process</button>
            </div>
        `).join('');
    } else {
        recentUnstake.innerHTML = '<div class="admin-activity-item">No pending unstake requests</div>';
    }
}

// ==================== CHARTS ====================
function initCharts() {
    // User Growth Chart
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

    // Staking Chart
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
function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    let html = '';
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td><strong>${user.userId}</strong></td>
                <td>${user.name}</td>
                <td><span class="admin-status-badge ${user.status}">${user.status}</span></td>
                <td>${user.walletAddress.substring(0,10)}...</td>
                <td>${user.pin}</td>
                <td>$${user.fundWallet}</td>
                <td>$${user.withdrawWallet}</td>
                <td>
                    <button class="admin-action-btn" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                    <button class="admin-action-btn" onclick="viewUserDetails(${user.id})"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function searchUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    let html = '';
    
    users.filter(user => 
        user.userId.toLowerCase().includes(search) ||
        user.name.toLowerCase().includes(search)
    ).forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td><strong>${user.userId}</strong></td>
                <td>${user.name}</td>
                <td><span class="admin-status-badge ${user.status}">${user.status}</span></td>
                <td>${user.walletAddress.substring(0,10)}...</td>
                <td>${user.pin}</td>
                <td>$${user.fundWallet}</td>
                <td>$${user.withdrawWallet}</td>
                <td>
                    <button class="admin-action-btn" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                    <button class="admin-action-btn" onclick="viewUserDetails(${user.id})"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserUsername').value = user.userId;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserPassword').value = '';
    document.getElementById('editUserWallet').value = user.walletAddress;
    document.getElementById('editUserPin').value = user.pin;
    document.getElementById('editFundWallet').value = user.fundWallet;
    document.getElementById('editWithdrawWallet').value = user.withdrawWallet;
    document.getElementById('editUserStatus').value = user.status;
    
    openModal('editUserModal');
}

function saveUserChanges() {
    const id = parseInt(document.getElementById('editUserId').value);
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    user.name = document.getElementById('editUserName').value;
    user.walletAddress = document.getElementById('editUserWallet').value;
    user.pin = document.getElementById('editUserPin').value;
    user.fundWallet = parseFloat(document.getElementById('editFundWallet').value);
    user.withdrawWallet = parseFloat(document.getElementById('editWithdrawWallet').value);
    user.status = document.getElementById('editUserStatus').value;
    
    const newPass = document.getElementById('editUserPassword').value;
    if (newPass) {
        user.password = newPass;
        alert(`Password changed for ${user.userId}`);
    }
    
    loadUsersTable();
    closeModal('editUserModal');
    alert('User updated successfully!');
}

function viewUserDetails(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    alert(`User Details:
ID: ${user.userId}
Name: ${user.name}
PIN: ${user.pin}
Password: ${user.password}
Fund Wallet: $${user.fundWallet}
Withdraw Wallet: $${user.withdrawWallet}
Status: ${user.status}
Joined: ${user.joined}`);
}

// ==================== WITHDRAWALS ====================
function loadWithdrawalsTable() {
    const tbody = document.getElementById('withdrawalsTableBody');
    let html = '';
    
    withdrawals.forEach(w => {
        html += `
            <tr>
                <td>${w.date}</td>
                <td><strong>${w.userName}</strong><br><small>${w.userId}</small></td>
                <td>$${w.amount}</td>
                <td>$${w.fee}</td>
                <td>$${w.netAmount}</td>
                <td>${w.wallet}</td>
                <td><span class="admin-status-badge ${w.status}">${w.status}</span></td>
                <td>
                    ${w.status === 'pending' ? 
                        `<button class="admin-action-btn success" onclick="processWithdrawal(${w.id})">Process</button>` : 
                        `<small>${w.txHash.substring(0,8)}...</small>`
                    }
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function filterWithdrawals() {
    const filter = document.getElementById('withdrawFilter').value;
    const tbody = document.getElementById('withdrawalsTableBody');
    let html = '';
    
    let filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter);
    
    filtered.forEach(w => {
        html += `
            <tr>
                <td>${w.date}</td>
                <td><strong>${w.userName}</strong><br><small>${w.userId}</small></td>
                <td>$${w.amount}</td>
                <td>$${w.fee}</td>
                <td>$${w.netAmount}</td>
                <td>${w.wallet}</td>
                <td><span class="admin-status-badge ${w.status}">${w.status}</span></td>
                <td>
                    ${w.status === 'pending' ? 
                        `<button class="admin-action-btn success" onclick="processWithdrawal(${w.id})">Process</button>` : 
                        `<small>${w.txHash.substring(0,8)}...</small>`
                    }
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function processWithdrawal(id) {
    const withdrawal = withdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    document.getElementById('processWithdrawalId').value = withdrawal.id;
    document.getElementById('processWithdrawalUser').textContent = withdrawal.userName;
    document.getElementById('processWithdrawalAmount').textContent = withdrawal.amount;
    document.getElementById('processWithdrawalFee').textContent = withdrawal.fee;
    document.getElementById('processWithdrawalNet').textContent = withdrawal.netAmount;
    document.getElementById('processWithdrawalWallet').textContent = withdrawal.wallet;
    document.getElementById('processWithdrawalTxHash').value = '';
    
    openModal('processWithdrawalModal');
}

function approveWithdrawal() {
    const id = parseInt(document.getElementById('processWithdrawalId').value);
    const withdrawal = withdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    const txHash = document.getElementById('processWithdrawalTxHash').value || '0x' + Math.random().toString(36).substring(2,15);
    
    withdrawal.status = 'completed';
    withdrawal.txHash = txHash;
    
    loadWithdrawalsTable();
    closeModal('processWithdrawalModal');
    alert('Withdrawal approved and marked as paid!');
}

function rejectWithdrawal() {
    const id = parseInt(document.getElementById('processWithdrawalId').value);
    withdrawals = withdrawals.filter(w => w.id !== id);
    
    loadWithdrawalsTable();
    closeModal('processWithdrawalModal');
    alert('Withdrawal rejected!');
}

// ==================== UNSTAKE REQUESTS ====================
function loadUnstakeTable() {
    const tbody = document.getElementById('unstakeTableBody');
    let html = '';
    
    unstakeRequests.forEach(u => {
        html += `
            <tr>
                <td>${u.date}</td>
                <td><strong>${u.userName}</strong><br><small>${u.userId}</small></td>
                <td>${u.package}</td>
                <td>$${u.amount}</td>
                <td>$${u.earnings}</td>
                <td>$${u.total}</td>
                <td>${u.wallet}</td>
                <td><span class="admin-status-badge ${u.status}">${u.status}</span></td>
                <td>
                    ${u.status === 'pending' ? 
                        `<button class="admin-action-btn success" onclick="processUnstake(${u.id})">Process</button>` : 
                        'Completed'
                    }
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function processUnstake(id) {
    const unstake = unstakeRequests.find(u => u.id === id);
    if (!unstake) return;
    
    document.getElementById('processUnstakeId').value = unstake.id;
    document.getElementById('processUnstakeUser').textContent = unstake.userName;
    document.getElementById('processUnstakePackage').textContent = unstake.package;
    document.getElementById('processUnstakePrincipal').textContent = unstake.amount;
    document.getElementById('processUnstakeEarnings').textContent = unstake.earnings;
    document.getElementById('processUnstakeTotal').textContent = unstake.total;
    document.getElementById('processUnstakeWallet').textContent = unstake.wallet;
    document.getElementById('processUnstakeTxHash').value = '';
    
    openModal('processUnstakeModal');
}

function approveUnstake() {
    const id = parseInt(document.getElementById('processUnstakeId').value);
    const unstake = unstakeRequests.find(u => u.id === id);
    if (!unstake) return;
    
    const txHash = document.getElementById('processUnstakeTxHash').value || '0x' + Math.random().toString(36).substring(2,15);
    
    unstake.status = 'completed';
    unstake.txHash = txHash;
    
    loadUnstakeTable();
    closeModal('processUnstakeModal');
    alert('Unstake marked as paid!');
}

// ==================== TRANSACTIONS ====================
function loadTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    let html = '';
    
    transactions.forEach(t => {
        html += `
            <tr>
                <td>${t.date}</td>
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

function filterTransactions() {
    const filter = document.getElementById('transactionFilter').value;
    const tbody = document.getElementById('transactionsTableBody');
    let html = '';
    
    let filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
    
    filtered.forEach(t => {
        html += `
            <tr>
                <td>${t.date}</td>
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

// ==================== STAKING ====================
function loadStakingTable() {
    const tbody = document.getElementById('stakingTableBody');
    let html = '';
    
    stakings.forEach(s => {
        html += `
            <tr>
                <td><strong>${s.userName}</strong><br><small>${s.userId}</small></td>
                <td><span class="admin-status-badge">${s.package}</span></td>
                <td>$${s.amount}</td>
                <td>${s.dailyROI}%</td>
                <td>${s.startDate}</td>
                <td>${s.endDate}</td>
                <td><span class="admin-status-badge ${s.status}">${s.status}</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Update package stats
    document.getElementById('basicStakers').textContent = '5';
    document.getElementById('basicAmount').textContent = '$4,500';
    document.getElementById('proStakers').textContent = '3';
    document.getElementById('proAmount').textContent = '$3,200';
    document.getElementById('eliteStakers').textContent = '2';
    document.getElementById('eliteAmount').textContent = '$2,100';
}

// ==================== BOT SETTINGS ====================
function loadBotSettings() {
    document.getElementById('botStartTime').value = botSettings.startTime;
    document.getElementById('botEndTime').value = botSettings.endTime;
    document.getElementById('levelDelay').value = botSettings.levelDelay;
    document.getElementById('botStatusSelect').value = botSettings.status;
    document.getElementById('totalBotTrades').value = botSettings.totalTrades.toLocaleString();
    document.getElementById('botWinRate').value = botSettings.winRate;
    document.getElementById('totalBotProfit').value = '$' + botSettings.totalProfit.toLocaleString();
}

function saveBotSettings() {
    botSettings.startTime = document.getElementById('botStartTime').value;
    botSettings.endTime = document.getElementById('botEndTime').value;
    botSettings.levelDelay = parseInt(document.getElementById('levelDelay').value);
    botSettings.status = document.getElementById('botStatusSelect').value;
    
    alert('Bot settings saved successfully!');
}

function resetBotStats() {
    if (confirm('Reset all bot statistics?')) {
        botSettings.totalTrades = 0;
        botSettings.winRate = 0;
        botSettings.totalProfit = 0;
        loadBotSettings();
        alert('Bot statistics reset!');
    }
}

// ==================== ROI SETTINGS ====================
function loadROISettings() {
    document.getElementById('basicMin').value = roisettings.basic.min;
    document.getElementById('basicMinROI').value = roisettings.basic.minROI;
    document.getElementById('basicMaxROI').value = roisettings.basic.maxROI;
    document.getElementById('basicDays').value = roisettings.basic.days;
    
    document.getElementById('proMin').value = roisettings.pro.min;
    document.getElementById('proMinROI').value = roisettings.pro.minROI;
    document.getElementById('proMaxROI').value = roisettings.pro.maxROI;
    document.getElementById('proDays').value = roisettings.pro.days;
    
    document.getElementById('eliteMin').value = roisettings.elite.min;
    document.getElementById('eliteMinROI').value = roisettings.elite.minROI;
    document.getElementById('eliteMaxROI').value = roisettings.elite.maxROI;
    document.getElementById('eliteDays').value = roisettings.elite.days;
}

function saveROISettings() {
    roisettings.basic = {
        min: parseFloat(document.getElementById('basicMin').value),
        minROI: parseFloat(document.getElementById('basicMinROI').value),
        maxROI: parseFloat(document.getElementById('basicMaxROI').value),
        days: parseInt(document.getElementById('basicDays').value)
    };
    roisettings.pro = {
        min: parseFloat(document.getElementById('proMin').value),
        minROI: parseFloat(document.getElementById('proMinROI').value),
        maxROI: parseFloat(document.getElementById('proMaxROI').value),
        days: parseInt(document.getElementById('proDays').value)
    };
    roisettings.elite = {
        min: parseFloat(document.getElementById('eliteMin').value),
        minROI: parseFloat(document.getElementById('eliteMinROI').value),
        maxROI: parseFloat(document.getElementById('eliteMaxROI').value),
        days: parseInt(document.getElementById('eliteDays').value)
    };
    
    alert('ROI settings saved successfully!');
}

function resetROISettings() {
    if (confirm('Reset ROI settings to defaults?')) {
        roisettings = {
            basic: { min: 20, minROI: 0.9, maxROI: 1.2, days: 90 },
            pro: { min: 150, minROI: 1.1, maxROI: 1.4, days: 180 },
            elite: { min: 300, minROI: 1.4, maxROI: 2.0, days: 450 }
        };
        loadROISettings();
        alert('ROI settings reset to defaults!');
    }
}

// ==================== SALARY SETTINGS ====================
function loadSalarySettings() {
    document.getElementById('rank1Direct').value = salarySettings.rank1.direct;
    document.getElementById('rank1Team').value = salarySettings.rank1.team;
    document.getElementById('rank1Salary').value = salarySettings.rank1.salary;
    
    document.getElementById('rank2Direct').value = salarySettings.rank2.direct;
    document.getElementById('rank2Team').value = salarySettings.rank2.team;
    document.getElementById('rank2Salary').value = salarySettings.rank2.salary;
    
    document.getElementById('rank3Direct').value = salarySettings.rank3.direct;
    document.getElementById('rank3Team').value = salarySettings.rank3.team;
    document.getElementById('rank3Salary').value = salarySettings.rank3.salary;
    
    document.getElementById('rank4Direct').value = salarySettings.rank4.direct;
    document.getElementById('rank4Team').value = salarySettings.rank4.team;
    document.getElementById('rank4Salary').value = salarySettings.rank4.salary;
    
    document.getElementById('rank5Direct').value = salarySettings.rank5.direct;
    document.getElementById('rank5Team').value = salarySettings.rank5.team;
    document.getElementById('rank5Salary').value = salarySettings.rank5.salary;
    
    document.getElementById('rank6Direct').value = salarySettings.rank6.direct;
    document.getElementById('rank6Team').value = salarySettings.rank6.team;
    document.getElementById('rank6Salary').value = salarySettings.rank6.salary;
}

function saveSalarySettings() {
    salarySettings.rank1 = {
        direct: parseFloat(document.getElementById('rank1Direct').value),
        team: parseFloat(document.getElementById('rank1Team').value),
        salary: parseFloat(document.getElementById('rank1Salary').value)
    };
    salarySettings.rank2 = {
        direct: parseFloat(document.getElementById('rank2Direct').value),
        team: parseFloat(document.getElementById('rank2Team').value),
        salary: parseFloat(document.getElementById('rank2Salary').value)
    };
    salarySettings.rank3 = {
        direct: parseFloat(document.getElementById('rank3Direct').value),
        team: parseFloat(document.getElementById('rank3Team').value),
        salary: parseFloat(document.getElementById('rank3Salary').value)
    };
    salarySettings.rank4 = {
        direct: parseFloat(document.getElementById('rank4Direct').value),
        team: parseFloat(document.getElementById('rank4Team').value),
        salary: parseFloat(document.getElementById('rank4Salary').value)
    };
    salarySettings.rank5 = {
        direct: parseFloat(document.getElementById('rank5Direct').value),
        team: parseFloat(document.getElementById('rank5Team').value),
        salary: parseFloat(document.getElementById('rank5Salary').value)
    };
    salarySettings.rank6 = {
        direct: parseFloat(document.getElementById('rank6Direct').value),
        team: parseFloat(document.getElementById('rank6Team').value),
        salary: parseFloat(document.getElementById('rank6Salary').value)
    };
    
    alert('Salary settings saved successfully!');
}

// ==================== WALLET TRANSFER ====================
function loadUserSelect() {
    const select = document.getElementById('transferUser');
    let options = '<option value="">Select User</option>';
    
    users.forEach(u => {
        options += `<option value="${u.id}">${u.userId} - ${u.name}</option>`;
    });
    
    select.innerHTML = options;
}

function loadUserWallets() {
    const userId = document.getElementById('transferUser').value;
    if (!userId) return;
    
    const user = users.find(u => u.id == userId);
    if (!user) return;
    
    document.getElementById('userBalanceDisplay').innerHTML = `
        <h4 style="color:#00ffd9; margin-bottom:10px">${user.userId}</h4>
        <p>Fund Wallet: $${user.fundWallet}</p>
        <p>Withdraw Wallet: $${user.withdrawWallet}</p>
        <p>Total: $${user.fundWallet + user.withdrawWallet}</p>
    `;
}

function transferFunds() {
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
    
    const user = users.find(u => u.id == userId);
    if (!user) return;
    
    if (fromWallet === 'fund' && user.fundWallet < amount) {
        alert('Insufficient funds in Fund Wallet');
        return;
    }
    if (fromWallet === 'withdraw' && user.withdrawWallet < amount) {
        alert('Insufficient funds in Withdraw Wallet');
        return;
    }
    
    // Perform transfer
    if (fromWallet === 'fund') {
        user.fundWallet -= amount;
        if (toWallet === 'withdraw') user.withdrawWallet += amount;
    } else {
        user.withdrawWallet -= amount;
        if (toWallet === 'fund') user.fundWallet += amount;
    }
    
    loadUserWallets();
    alert(`Successfully transferred $${amount}`);
    document.getElementById('transferAmount').value = '';
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
    
    if (current !== 'admin123') {
        alert('Current password is incorrect');
        return;
    }
    
    if (newPass !== confirm) {
        alert('New passwords do not match');
        return;
    }
    
    alert('Password changed successfully! (Demo only)');
    document.getElementById('currentAdminPass').value = '';
    document.getElementById('newAdminPass').value = '';
    document.getElementById('confirmAdminPass').value = '';
}

// ==================== STAKING MODAL ====================
function showAddStakingModal() {
    const userSelect = document.getElementById('stakingUserId');
    let options = '<option value="">Select User</option>';
    
    users.forEach(u => {
        options += `<option value="${u.id}">${u.userId} - ${u.name}</option>`;
    });
    
    userSelect.innerHTML = options;
    openModal('addStakingModal');
}

function addStaking() {
    const userId = document.getElementById('stakingUserId').value;
    const pkg = document.getElementById('stakingPackage').value;
    const amount = parseFloat(document.getElementById('stakingAmount').value);
    const roi = parseFloat(document.getElementById('stakingROI').value);
    
    if (!userId || !amount || !roi) {
        alert('Please fill all fields');
        return;
    }
    
    const user = users.find(u => u.id == userId);
    if (!user) return;
    
    const startDate = new Date();
    let endDate = new Date();
    let days = pkg === 'BASIC' ? 90 : pkg === 'PRO' ? 180 : 450;
    endDate.setDate(endDate.getDate() + days);
    
    const newStaking = {
        id: stakings.length + 1,
        userId: user.userId,
        userName: user.name,
        package: pkg,
        amount: amount,
        dailyROI: roi,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'active'
    };
    
    stakings.push(newStaking);
    loadStakingTable();
    closeModal('addStakingModal');
    alert('Staking added successfully!');
}

// ==================== MODAL FUNCTIONS ====================
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    // Login page shown by default
    updateServerUptime();
    setInterval(updateServerUptime, 1000);
});

function updateServerUptime() {
    // Demo uptime calculation
    const uptime = document.getElementById('serverUptime');
    if (uptime) {
        uptime.value = '2 hours 34 minutes';
    }
}