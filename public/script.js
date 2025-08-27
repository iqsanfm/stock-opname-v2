// API Configuration - Point to separate backend
const API_BASE_URL = 'https://backend-vercel-nu-sable.vercel.app';
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Data storage (will be replaced with API calls)
let dailyTransactions = [];
let monthlyReports = [];
let opnameData = [];

// Initialize demo users (for local fallback only)
function initializeDemoUsers() {
    const existingUsers = localStorage.getItem('registeredUsers');
    if (!existingUsers) {
        const demoUsers = [
            {
                username: 'admin',
                email: 'admin@inventory.com',
                password: 'password123',
                role: 'admin'
            },
            {
                username: 'user1',
                email: 'user1@inventory.com', 
                password: 'password123',
                role: 'user'
            }
        ];
        localStorage.setItem('registeredUsers', JSON.stringify(demoUsers));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoUsers();
    checkAuthStatus();
    
    // Set today's date as default
    if (document.getElementById('tanggal')) {
        document.getElementById('tanggal').valueAsDate = new Date();
        document.getElementById('reportMonth').value = new Date().toISOString().slice(0, 7);
        document.getElementById('opnameMonth').value = new Date().toISOString().slice(0, 7);
        
        loadDailyTransactions();
        updateDailyStatistics();
        displayDailyTransactions();
        displayMonthlyReport();
        displayOpnameData();
        updateSparepartsList();
        updateUIBasedOnRole();
    }
});

// Update UI based on user role
function updateUIBasedOnRole() {
    if (!currentUser) return;
    
    // Hide sensitive buttons for regular users
    if (currentUser.role === 'user') {
        const sensitiveButtons = [
            'button[onclick="importData()"]',
            'button[onclick="importCSV()"]',
            'button[onclick="deleteAllData()"]'
        ];
        
        sensitiveButtons.forEach(selector => {
            const button = document.querySelector(selector);
            if (button) {
                button.style.display = 'none';
            }
        });
    }
}

// Authentication functions
function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        hideAuthModal();
        setTimeout(() => {
            updateUserInfo();
            updateUIBasedOnRole();
        }, 100);
        loadDailyTransactions();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
}

function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.body.classList.remove('login-page');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

// API helper function
async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
        method,
        headers
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API Error');
        }
        
        return result;
    } catch (error) {
        // Handle CORS and network errors more gracefully
        if (error.name === 'TypeError' && (
            error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('CORS')
        )) {
            console.error('CORS or Network Error detected:', error);
            throw new Error('CORS_ERROR');
        }
        console.error('API Call Error:', error);
        throw error;
    }
}

// Login form handler
document.getElementById('loginFormElement').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Try backend authentication first
        const loginData = { email, password };
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success && result.token) {
            // Backend authentication successful
            authToken = result.token;
            currentUser = {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                role: result.user.role
            };
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            hideAuthModal();
            setTimeout(() => {
                updateUserInfo();
                updateUIBasedOnRole();
                updateSparepartsList(); // Update SKU suggestions from API
            }, 100);
            loadDailyTransactions();
            showAlert('Login berhasil! (Backend API)', 'success');
        } else {
            throw new Error(result.message || 'Login gagal');
        }
    } catch (error) {
        const isCorsError = error.message === 'CORS_ERROR';
        const errorMsg = isCorsError ? 'CORS issue detected, using offline mode' : error.message;
        console.log('Backend login failed, trying local auth:', errorMsg);
        
        // Fallback to local authentication
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = {
                username: user.username,
                email: user.email,
                role: user.role
            };
            
            authToken = null; // No token for local auth
            localStorage.removeItem('authToken');
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            hideAuthModal();
            setTimeout(() => {
                updateUserInfo();
                updateUIBasedOnRole();
                updateSparepartsList(); // Update with local data
            }, 100);
            loadDailyTransactions();
            
            const modeText = isCorsError ? 'Mode Offline - CORS Issue' : 'Mode Offline';
            showAlert(`Login berhasil! (${modeText})`, 'success');
        } else {
            showAlert('Email atau password salah!', 'error');
        }
    }
});

// Register form handler
document.getElementById('registerFormElement').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        showAlert('Email sudah terdaftar!', 'error');
        return;
    }
    
    // Add new user
    const newUser = { username, email, password, role };
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    currentUser = {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    hideAuthModal();
    setTimeout(() => {
        updateUserInfo();
        updateUIBasedOnRole();
    }, 100);
    loadDailyTransactions();
    showAlert('Registrasi berhasil!', 'success');
});

// Role-based access control
function hasPermission(action) {
    if (!currentUser) return false;
    
    // Admin has access to all actions
    if (currentUser.role === 'admin') {
        return true;
    }
    
    // User permissions - can't edit/delete sensitive data
    if (currentUser.role === 'user') {
        const restrictedActions = ['delete', 'deleteAllData', 'importData', 'importCSV'];
        return !restrictedActions.includes(action);
    }
    
    return false;
}

function updateUserInfo() {
    if (currentUser) {
        const roleColor = currentUser.role === 'admin' ? '#e74c3c' : '#3498db';
        const backendMode = authToken ? '🌐 API Mode' : '💾 Offline Mode';
        const backendColor = authToken ? '#27ae60' : '#f39c12';
        
        document.getElementById('userInfo').innerHTML = 
            `<div style="display: flex; flex-direction: column; align-items: flex-start;">
                <strong style="font-size: 1rem;">${currentUser.username}</strong>
                <span style="color: ${roleColor}; font-weight: 600; text-transform: uppercase; font-size: 0.8rem;">
                    ${currentUser.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                </span>
                <span style="color: ${backendColor}; font-size: 0.7rem; font-weight: 500;">
                    ${backendMode}
                </span>
            </div>
            <button class="logout-btn" onclick="logout()">
                🚪 Logout
            </button>
        `;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    dailyTransactions = [];
    monthlyReports = [];
    opnameData = [];
    showAuthModal();
    showAlert('Logout berhasil!', 'success');
}

// Enhanced localStorage functions for persistent data
function saveAllData() {
    try {
        localStorage.setItem('dailyTransactions', JSON.stringify(dailyTransactions));
        localStorage.setItem('monthlyReports', JSON.stringify(monthlyReports));
        localStorage.setItem('opnameData', JSON.stringify(opnameData));
        
        // Also save to backup
        const backupData = {
            dailyTransactions,
            monthlyReports,
            opnameData,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('stockOpnameBackup', JSON.stringify(backupData));
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        showAlert('Error menyimpan data: ' + error.message, 'error');
    }
}

function loadAllData() {
    try {
        // Load main data
        dailyTransactions = JSON.parse(localStorage.getItem('dailyTransactions')) || [];
        monthlyReports = JSON.parse(localStorage.getItem('monthlyReports')) || [];
        opnameData = JSON.parse(localStorage.getItem('opnameData')) || [];
        
        // Check backup if main data is empty
        if (dailyTransactions.length === 0 && monthlyReports.length === 0) {
            const backup = JSON.parse(localStorage.getItem('stockOpnameBackup'));
            if (backup) {
                dailyTransactions = backup.dailyTransactions || [];
                monthlyReports = backup.monthlyReports || [];
                opnameData = backup.opnameData || [];
                console.log('Data loaded from backup:', backup.savedAt);
            }
        }
        
        console.log('Data loaded - Transactions:', dailyTransactions.length, 'Reports:', monthlyReports.length);
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Error memuat data: ' + error.message, 'error');
    }
}

async function loadDailyTransactions() {
    loadAllData();
}

// Utility functions
function formatNumber(num) {
    return Math.round(num).toLocaleString('id-ID');
}

function formatCurrency(num) {
    return 'Rp ' + formatNumber(num);
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Tab switching
function switchTab(tab) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Update data when switching tabs
    if (tab === 'daily') {
        updateDailyStatistics();
        displayDailyTransactions();
    } else if (tab === 'monthly') {
        displayMonthlyReport();
    } else if (tab === 'opname') {
        displayOpnameData();
    }
}

// Validation functions
function validateTransaction(data) {
    const errors = [];
    const warnings = [];

    // Basic validation
    if (!data.sku || data.sku.trim().length < 2) {
        errors.push('SKU harus minimal 2 karakter');
    }

    if (!data.sparepart || data.sparepart.trim().length < 2) {
        errors.push('Nama barang harus minimal 2 karakter');
    }

    if (!data.jenis) {
        errors.push('Jenis barang harus diisi');
    }

    if (!data.merk || data.merk.trim().length < 1) {
        errors.push('Merk harus diisi');
    }

    if (!data.tipe_transaksi) {
        errors.push('Tipe transaksi harus dipilih');
    }

    if (!data.jumlah || data.jumlah <= 0) {
        errors.push('Jumlah harus lebih dari 0');
    }

    if (data.tipe_transaksi !== 'keluar' && (!data.harga || data.harga <= 0)) {
        errors.push('Harga harus lebih dari 0 untuk transaksi masuk/stock awal');
    }

    // Check for duplicate SKU only for different items (different sparepart/jenis/merk)
    const existingSKU = dailyTransactions.find(t => 
        t.sku && t.sku.toUpperCase() === data.sku.toUpperCase() &&
        (t.sparepart.toLowerCase().trim() !== data.sparepart.toLowerCase().trim() ||
         t.jenis !== data.jenis ||
         t.merk.toLowerCase().trim() !== data.merk.toLowerCase().trim())
    );

    if (existingSKU) {
        errors.push(`SKU '${data.sku}' sudah digunakan untuk item berbeda: ${existingSKU.sparepart} (${existingSKU.jenis} - ${existingSKU.merk})`);
    }

    // Check for duplicates on same date
    const sameDate = dailyTransactions.filter(t => t.tanggal === data.tanggal);
    const duplicate = sameDate.find(t => 
        t.sparepart.toLowerCase().trim() === data.sparepart.toLowerCase().trim() &&
        t.jenis === data.jenis &&
        t.merk.toLowerCase().trim() === data.merk.toLowerCase().trim() &&
        t.tipe_transaksi === data.tipe_transaksi
    );

    if (duplicate) {
        warnings.push(`Item yang sama sudah ada di tanggal ${data.tanggal}. Yakin ingin menambah lagi?`);
    }

    // Check for multiple stock_awal entries
    if (data.tipe_transaksi === 'stock_awal') {
        const existingStockAwal = dailyTransactions.find(t => 
            t.sparepart.toLowerCase().trim() === data.sparepart.toLowerCase().trim() &&
            t.jenis === data.jenis &&
            t.merk.toLowerCase().trim() === data.merk.toLowerCase().trim() &&
            t.tipe_transaksi === 'stock_awal'
        );

        if (existingStockAwal) {
            warnings.push(`Stock awal untuk item ini sudah ada. Sebaiknya edit yang lama atau gunakan 'Barang Masuk'.`);
        }
    }

    // Price consistency check
    const similarItems = dailyTransactions.filter(t => 
        t.sparepart.toLowerCase().trim() === data.sparepart.toLowerCase().trim() &&
        t.jenis === data.jenis &&
        t.merk.toLowerCase().trim() === data.merk.toLowerCase().trim() &&
        t.harga > 0
    );

    if (similarItems.length > 0) {
        const avgPrice = similarItems.reduce((sum, t) => sum + t.harga, 0) / similarItems.length;
        const priceDifference = Math.abs(data.harga - avgPrice) / avgPrice;

        if (priceDifference > 0.2) { // More than 20% difference
            warnings.push(`Harga berbeda signifikan dari rata-rata sebelumnya (Rp ${Math.round(avgPrice).toLocaleString('id-ID')}). Pastikan harga benar.`);
        }
    }

    // Check stock quantity logic
    if (data.tipe_transaksi === 'keluar') {
        const itemKey = `${data.sparepart.toLowerCase().trim()}_${data.jenis}_${data.merk.toLowerCase().trim()}`;
        
        // Calculate current stock
        const stockTransactions = dailyTransactions.filter(t => 
            `${t.sparepart.toLowerCase().trim()}_${t.jenis}_${t.merk.toLowerCase().trim()}` === itemKey
        );

        const currentStock = stockTransactions.reduce((stock, t) => {
            if (t.tipe_transaksi === 'stock_awal' || t.tipe_transaksi === 'masuk') {
                return stock + t.jumlah;
            } else if (t.tipe_transaksi === 'keluar') {
                return stock - t.jumlah;
            }
            return stock;
        }, 0);

        if (data.jumlah > currentStock) {
            warnings.push(`Stock tidak cukup! Stock saat ini: ${currentStock}, diminta: ${data.jumlah}`);
        }
    }

    return { errors, warnings };
}

// Daily transaction form submission
document.getElementById('dailyTransactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = {
        id: Date.now(), // Unique ID for editing
        tanggal: formData.get('tanggal'),
        sku: formData.get('sku').trim().toUpperCase(), // Normalize SKU to uppercase
        sparepart: formData.get('sparepart').trim(),
        jenis: formData.get('jenis'),
        merk: formData.get('merk').trim(),
        tipe_transaksi: formData.get('tipe_transaksi'),
        jumlah: parseInt(formData.get('jumlah')) || 0,
        harga: parseFloat(formData.get('harga')) || 0,
        keterangan: formData.get('keterangan') || '',
        total: (parseInt(formData.get('jumlah')) || 0) * (parseFloat(formData.get('harga')) || 0)
    };
    
    // Validate transaction
    const validation = validateTransaction(data);
    
    // Show errors if any
    if (validation.errors.length > 0) {
        showAlert('Error: ' + validation.errors.join(', '), 'error');
        return;
    }
    
    // Show warnings and ask for confirmation
    if (validation.warnings.length > 0) {
        const warningMessage = 'Peringatan:\n\n' + validation.warnings.join('\n\n') + '\n\nLanjutkan?';
        if (!confirm(warningMessage)) {
            return;
        }
    }
    
    dailyTransactions.push(data);
    saveAllData(); // Auto-save dengan backup
    
    updateDailyStatistics();
    displayDailyTransactions();
    updateSparepartsList();
    clearDailyForm();
    
    showAlert('Transaksi berhasil disimpan!', 'success');
});

function toggleTransactionFields() {
    const tipeTransaksi = document.getElementById('tipe_transaksi').value;
    const hargaGroup = document.getElementById('hargaGroup');
    const hargaInput = document.getElementById('harga');
    
    if (tipeTransaksi === 'keluar') {
        hargaGroup.style.display = 'none';
        hargaInput.required = false;
        hargaInput.value = 0;
    } else {
        hargaGroup.style.display = 'block';
        hargaInput.required = true;
    }
}


function updateDailyStatistics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's transactions for "Transaksi Hari Ini"
    const todayTransactions = dailyTransactions.filter(t => t.tanggal === today);
    const todayCount = todayTransactions.length;
    
    // All transactions for totals
    const allTransactions = dailyTransactions;
    const totalIn = allTransactions.filter(t => t.tipe_transaksi === 'masuk' || t.tipe_transaksi === 'stock_awal')
                    .reduce((sum, t) => sum + t.jumlah, 0);
    const totalOut = allTransactions.filter(t => t.tipe_transaksi === 'keluar')
                   .reduce((sum, t) => sum + t.jumlah, 0);
    const totalValue = allTransactions.reduce((sum, t) => sum + t.total, 0);
    
    // Update display
    document.getElementById('dailyTransactions').textContent = todayCount;
    document.getElementById('dailyIn').textContent = totalIn;
    document.getElementById('dailyOut').textContent = totalOut;
    document.getElementById('dailyValue').textContent = formatCurrency(totalValue);
}

function displayDailyTransactions() {
    const tbody = document.getElementById('dailyTransactionsBody');
    tbody.innerHTML = '';
    
    let filteredTransactions = [...dailyTransactions].reverse(); // Show newest first
    
    // Apply filters
    const dateFilter = document.getElementById('filterDate')?.value;
    const sparepartFilter = document.getElementById('filterSparepart')?.value.toLowerCase();
    const typeFilter = document.getElementById('filterType')?.value;
    
    if (dateFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.tanggal === dateFilter);
    }
    if (sparepartFilter) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.sparepart.toLowerCase().includes(sparepartFilter));
    }
    if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.tipe_transaksi === typeFilter);
    }
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.tanggal}</td>
            <td>${transaction.sku || '-'}</td>
            <td>${transaction.sparepart}</td>
            <td>${transaction.jenis}</td>
            <td>${transaction.merk}</td>
            <td><span class="badge ${transaction.tipe_transaksi}">${transaction.tipe_transaksi.replace('_', ' ').toUpperCase()}</span></td>
            <td>${transaction.jumlah}</td>
            <td>${formatCurrency(transaction.harga)}</td>
            <td>${formatCurrency(transaction.total)}</td>
            <td>${transaction.keterangan || '-'}</td>
            <td class="text-center">
                ${hasPermission('delete') ? `<button class="btn btn-danger btn-small" onclick="deleteTransaction(${transaction.id})">Hapus</button>` : '<span class="text-muted">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterDailyTransactions() {
    displayDailyTransactions();
}

function deleteTransaction(id) {
    if (!hasPermission('delete')) {
        showAlert('Anda tidak memiliki izin untuk menghapus data!', 'error');
        return;
    }
    
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
        dailyTransactions = dailyTransactions.filter(t => t.id !== id);
        saveAllData(); // Auto-save dengan backup
        displayDailyTransactions();
        updateDailyStatistics();
        showAlert('Transaksi berhasil dihapus!', 'success');
    }
}

function updateSparepartsList() {
    // Update spareparts datalist (local data)
    const sparepartsDatalist = document.getElementById('sparepartsList');
    const spareparts = [...new Set(dailyTransactions.map(t => t.sparepart))];
    
    sparepartsDatalist.innerHTML = '';
    spareparts.forEach(sparepart => {
        const option = document.createElement('option');
        option.value = sparepart;
        sparepartsDatalist.appendChild(option);
    });

    // Update SKU datalist from API if authenticated
    updateSKUDatalistFromAPI();
}

async function updateSKUDatalistFromAPI() {
    const skuDatalist = document.getElementById('skuList');
    
    // If not authenticated, use local data
    if (!authToken || !currentUser) {
        updateSKUDatalistLocal();
        return;
    }

    try {
        const response = await apiCall('/items/suggestions');
        if (response.success && response.data) {
            skuDatalist.innerHTML = '';
            response.data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.sku;
                option.setAttribute('data-sparepart', item.name);
                option.setAttribute('data-jenis', item.category);
                option.setAttribute('data-merk', item.brand);
                option.textContent = item.label;
                skuDatalist.appendChild(option);
            });
        }
    } catch (error) {
        const isCorsError = error.message === 'CORS_ERROR';
        const errorMsg = isCorsError ? 'CORS issue, using local data' : error.message;
        console.error('Error loading SKU suggestions from API:', errorMsg);
        // Fallback to local data
        updateSKUDatalistLocal();
    }
}

function updateSKUDatalistLocal() {
    const skuDatalist = document.getElementById('skuList');
    const uniqueItems = {};
    
    // Create unique items map with latest transaction data for each SKU
    dailyTransactions.forEach(t => {
        if (t.sku) {
            uniqueItems[t.sku] = {
                sku: t.sku,
                sparepart: t.sparepart,
                jenis: t.jenis,
                merk: t.merk,
                harga: t.harga
            };
        }
    });
    
    skuDatalist.innerHTML = '';
    Object.values(uniqueItems).forEach(item => {
        const option = document.createElement('option');
        option.value = item.sku;
        option.setAttribute('data-sparepart', item.sparepart);
        option.setAttribute('data-jenis', item.jenis);
        option.setAttribute('data-merk', item.merk);
        option.setAttribute('data-harga', item.harga);
        option.textContent = `${item.sku} - ${item.sparepart}`;
        skuDatalist.appendChild(option);
    });
}

let autoFillTimeout;
let lastFilledSKU = ''; // Track last filled SKU to prevent duplicate alerts

function delayedAutoFill() {
    clearTimeout(autoFillTimeout);
    autoFillTimeout = setTimeout(() => {
        autoFillFromSKU(false); // false = don't show alert for input events
    }, 800); // 800ms delay to avoid too frequent calls
}

async function autoFillFromSKU(showAlert = true) {
    const skuInput = document.getElementById('sku_daily');
    const selectedSKU = skuInput.value.trim().toUpperCase(); // Convert to uppercase for consistency
    
    if (!selectedSKU || selectedSKU.length < 2) return;
    
    // Prevent duplicate processing of the same SKU
    if (selectedSKU === lastFilledSKU) return;
    
    let itemFound = false;
    
    // Try to get item from API first if authenticated
    if (authToken && currentUser) {
        try {
            const response = await apiCall(`/items/sku/${selectedSKU}`);
            if (response.success && response.data) {
                const item = response.data;
                // Auto-fill the form fields
                document.getElementById('sparepart_daily').value = item.name;
                document.getElementById('jenis_daily').value = item.category;
                document.getElementById('merk_daily').value = item.brand;
                
                // For masuk transactions, suggest the base price
                const tipeTransaksi = document.getElementById('tipe_transaksi').value;
                if (tipeTransaksi === 'masuk' && item.averagePrice > 0) {
                    document.getElementById('harga').value = item.averagePrice;
                }
                
                // Update last filled SKU
                lastFilledSKU = selectedSKU;
                itemFound = true;
                
                // Show info about the selected item only if requested
                if (showAlert) {
                    showAlert(`✅ Item ditemukan dari API: ${item.name} (${item.category} - ${item.brand})`, 'success');
                }
            }
        } catch (error) {
            const isCorsError = error.message === 'CORS_ERROR';
            const errorMsg = isCorsError ? 'CORS issue, trying local data' : 'Item not found in API, trying local data';
            console.log(errorMsg);
        }
    }
    
    // If not found in API, try local data
    if (!itemFound) {
        const existingItem = dailyTransactions.find(t => t.sku && t.sku.toUpperCase() === selectedSKU);
        
        if (existingItem) {
            // Auto-fill the form fields
            document.getElementById('sparepart_daily').value = existingItem.sparepart;
            document.getElementById('jenis_daily').value = existingItem.jenis;
            document.getElementById('merk_daily').value = existingItem.merk;
            
            // For masuk transactions, suggest the last known price
            const tipeTransaksi = document.getElementById('tipe_transaksi').value;
            if (tipeTransaksi === 'masuk' && existingItem.harga > 0) {
                document.getElementById('harga').value = existingItem.harga;
            }
            
            // Update last filled SKU
            lastFilledSKU = selectedSKU;
            itemFound = true;
            
            // Show info about the selected item only if requested
            if (showAlert) {
                showAlert(`✅ Item ditemukan: ${existingItem.sparepart} (${existingItem.jenis} - ${existingItem.merk})`, 'success');
            }
        }
    }
    
    if (!itemFound) {
        // Clear last filled SKU if not found
        lastFilledSKU = '';
    }
}

// Clear lastFilledSKU when form is reset
function clearDailyForm() {
    document.getElementById('dailyTransactionForm').reset();
    document.getElementById('tanggal').valueAsDate = new Date();
    lastFilledSKU = ''; // Reset tracking
    toggleTransactionFields();
}

function generateMonthlyReport() {
    const reportMonth = document.getElementById('reportMonth').value;
    if (!reportMonth) {
        showAlert('Pilih bulan untuk generate laporan!', 'error');
        return;
    }

    const monthlyData = calculateMonthlyData(reportMonth);
    
    // Store monthly report
    const existingReportIndex = monthlyReports.findIndex(r => r.month === reportMonth);
    if (existingReportIndex >= 0) {
        monthlyReports[existingReportIndex] = { month: reportMonth, data: monthlyData };
    } else {
        monthlyReports.push({ month: reportMonth, data: monthlyData });
    }
    
    saveAllData(); // Auto-save dengan backup  
    displayMonthlyReport();
    showAlert('Laporan bulanan berhasil di-generate!', 'success');
}

function calculateMonthlyData(month) {
    const monthTransactions = dailyTransactions.filter(t => t.tanggal.startsWith(month));
    const sparepartGroups = {};

    // Group by SKU (or fallback to sparepart+jenis+merk for old data)
    monthTransactions.forEach(transaction => {
        const key = transaction.sku || `${transaction.sparepart}_${transaction.jenis}_${transaction.merk}`;
        
        if (!sparepartGroups[key]) {
            sparepartGroups[key] = {
                sku: transaction.sku || '',
                sparepart: transaction.sparepart,
                jenis: transaction.jenis,
                merk: transaction.merk,
                stockAwal: 0,
                masuk: 0,
                keluar: 0,
                totalValueAwal: 0,
                totalValueMasuk: 0,
                hargaAwal: 0,
                transactions: []
            };
        }

        sparepartGroups[key].transactions.push(transaction);

        if (transaction.tipe_transaksi === 'stock_awal') {
            sparepartGroups[key].stockAwal += transaction.jumlah;
            sparepartGroups[key].totalValueAwal += transaction.total;
            sparepartGroups[key].hargaAwal = transaction.harga;
        } else if (transaction.tipe_transaksi === 'masuk') {
            sparepartGroups[key].masuk += transaction.jumlah;
            sparepartGroups[key].totalValueMasuk += transaction.total;
        } else if (transaction.tipe_transaksi === 'keluar') {
            sparepartGroups[key].keluar += transaction.jumlah;
        }
    });

    // Calculate final data using Weighted Average
    return Object.values(sparepartGroups).map(group => {
        const stockAkhir = group.stockAwal + group.masuk - group.keluar;
        
        // Weighted Average Calculation
        const totalValueAvailable = group.totalValueAwal + group.totalValueMasuk;
        const totalStockAvailable = group.stockAwal + group.masuk;
        
        const hargaRataRataWeighted = totalStockAvailable > 0 ? totalValueAvailable / totalStockAvailable : 0;
        const totalValue = stockAkhir * hargaRataRataWeighted;

        return {
            sku: group.sku,
            sparepart: group.sparepart,
            jenis: group.jenis,
            merk: group.merk,
            stockAwal: group.stockAwal,
            hargaAwal: group.hargaAwal,
            masuk: group.masuk,
            keluar: group.keluar,
            stockAkhir: stockAkhir,
            hargaRataRataWeighted: hargaRataRataWeighted,
            totalValue: totalValue
        };
    });
}

function displayMonthlyReport() {
    const reportMonth = document.getElementById('reportMonth').value;
    const tbody = document.getElementById('monthlyReportBody');
    tbody.innerHTML = '';

    if (!reportMonth) return;

    let monthlyData = [];
    const existingReport = monthlyReports.find(r => r.month === reportMonth);
    
    if (existingReport) {
        monthlyData = existingReport.data;
    } else {
        monthlyData = calculateMonthlyData(reportMonth);
    }

    // Apply filter
    const sparepartFilter = document.getElementById('filterMonthlySparepart')?.value.toLowerCase();
    if (sparepartFilter) {
        monthlyData = monthlyData.filter(item => 
            item.sparepart.toLowerCase().includes(sparepartFilter));
    }

    // Update statistics
    updateMonthlyStatistics(monthlyData, reportMonth);

    monthlyData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.sku || '-'}</td>
            <td>${item.sparepart}</td>
            <td>${item.jenis}</td>
            <td>${item.merk}</td>
            <td>${item.stockAwal}</td>
            <td>${formatCurrency(item.hargaAwal)}</td>
            <td>${item.masuk}</td>
            <td>${item.keluar}</td>
            <td>${item.stockAkhir}</td>
            <td>${formatCurrency(item.hargaRataRataWeighted)}</td>
            <td>${formatCurrency(item.totalValue)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateMonthlyStatistics(monthlyData, month) {
    const totalItems = monthlyData.reduce((sum, item) => sum + item.stockAkhir, 0);
    const totalValue = monthlyData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalIn = monthlyData.reduce((sum, item) => sum + item.masuk, 0);
    const totalOut = monthlyData.reduce((sum, item) => sum + item.keluar, 0);

    document.getElementById('monthlyItems').textContent = totalItems;
    document.getElementById('monthlyValue').textContent = formatCurrency(totalValue);
    document.getElementById('monthlyIn').textContent = totalIn;
    document.getElementById('monthlyOut').textContent = totalOut;
}

function copyToOpname() {
    const reportMonth = document.getElementById('reportMonth').value;
    if (!reportMonth) {
        showAlert('Pilih bulan untuk copy ke stock opname!', 'error');
        return;
    }

    const existingReport = monthlyReports.find(r => r.month === reportMonth);
    if (!existingReport) {
        showAlert('Generate laporan bulanan terlebih dahulu!', 'error');
        return;
    }

    // Copy to opname data
    const opnameMonth = reportMonth;
    const existingOpnameIndex = opnameData.findIndex(o => o.month === opnameMonth);
    
    const opnameItems = existingReport.data.map(item => ({
        sku: item.sku,
        sparepart: item.sparepart,
        jenis: item.jenis,
        merk: item.merk,
        stockSistem: item.stockAkhir,
        stockFisik: item.stockAkhir, // Default to system stock
        selisih: 0,
        harga: item.hargaRataRataWeighted,
        valueSistem: item.totalValue,
        valueFisik: item.totalValue,
        keterangan: ''
    }));

    if (existingOpnameIndex >= 0) {
        opnameData[existingOpnameIndex] = { month: opnameMonth, data: opnameItems };
    } else {
        opnameData.push({ month: opnameMonth, data: opnameItems });
    }

    saveAllData(); // Auto-save dengan backup
    document.getElementById('opnameMonth').value = opnameMonth;
    
    showAlert('Data berhasil dicopy ke stock opname!', 'success');
    switchTab('opname');
}

function displayOpnameData() {
    const opnameMonth = document.getElementById('opnameMonth').value;
    const tbody = document.getElementById('opnameBody');
    tbody.innerHTML = '';

    if (!opnameMonth) return;

    const existingOpname = opnameData.find(o => o.month === opnameMonth);
    if (!existingOpname) return;

    let data = existingOpname.data;

    // Apply filter
    const sparepartFilter = document.getElementById('filterOpnameSparepart')?.value.toLowerCase();
    if (sparepartFilter) {
        data = data.filter(item => 
            item.sparepart.toLowerCase().includes(sparepartFilter));
    }

    updateOpnameStatistics(data);

    data.forEach((item, index) => {
        // Find actual index in the original data array
        const actualIndex = existingOpname.data.findIndex(origItem => 
            (origItem.sku && item.sku && origItem.sku === item.sku) ||
            (origItem.sparepart === item.sparepart && 
             origItem.jenis === item.jenis && 
             origItem.merk === item.merk)
        );
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.sku || '-'}</td>
            <td>${item.sparepart}</td>
            <td>${item.jenis}</td>
            <td>${item.merk}</td>
            <td>${item.stockSistem}</td>
            <td><input type="number" value="${item.stockFisik}" min="0" onchange="updateStockFisik(${actualIndex}, this.value)" class="form-control"></td>
            <td class="${item.selisih > 0 ? 'positive' : item.selisih < 0 ? 'negative' : ''}">${item.selisih}</td>
            <td>${formatCurrency(item.harga)}</td>
            <td>${formatCurrency(item.valueSistem)}</td>
            <td>${formatCurrency(item.valueFisik)}</td>
            <td><input type="text" value="${item.keterangan}" onchange="updateKeterangan(${actualIndex}, this.value)" class="form-control" placeholder="Keterangan..."></td>
        `;
        tbody.appendChild(row);
    });
}

function updateStockFisik(index, value) {
    const opnameMonth = document.getElementById('opnameMonth').value;
    const existingOpname = opnameData.find(o => o.month === opnameMonth);
    
    if (existingOpname && index >= 0 && index < existingOpname.data.length && existingOpname.data[index]) {
        const stockFisik = parseInt(value) || 0;
        existingOpname.data[index].stockFisik = stockFisik;
        existingOpname.data[index].selisih = stockFisik - existingOpname.data[index].stockSistem;
        existingOpname.data[index].valueFisik = stockFisik * existingOpname.data[index].harga;
        
        saveAllData(); // Auto-save dengan backup
        displayOpnameData();
    }
}

function updateKeterangan(index, value) {
    const opnameMonth = document.getElementById('opnameMonth').value;
    const existingOpname = opnameData.find(o => o.month === opnameMonth);
    
    if (existingOpname && index >= 0 && index < existingOpname.data.length && existingOpname.data[index]) {
        existingOpname.data[index].keterangan = value;
        saveAllData(); // Auto-save dengan backup
    }
}

function updateOpnameStatistics(data) {
    const totalItems = data.length;
    const totalValue = data.reduce((sum, item) => sum + item.valueFisik, 0);
    const selisihPositif = data.filter(item => item.selisih > 0).reduce((sum, item) => sum + item.selisih, 0);
    const selisihNegatif = Math.abs(data.filter(item => item.selisih < 0).reduce((sum, item) => sum + item.selisih, 0));

    document.getElementById('opnameItems').textContent = totalItems;
    document.getElementById('opnameValue').textContent = formatCurrency(totalValue);
    document.getElementById('selisihPositif').textContent = selisihPositif;
    document.getElementById('selisihNegatif').textContent = selisihNegatif;
}

function saveOpnameResults() {
    const opnameMonth = document.getElementById('opnameMonth').value;
    if (!opnameMonth) {
        showAlert('Pilih bulan opname!', 'error');
        return;
    }

    const existingOpname = opnameData.find(o => o.month === opnameMonth);
    if (!existingOpname) {
        showAlert('Tidak ada data opname untuk disimpan!', 'error');
        return;
    }

    // Create adjustment transactions for differences
    const adjustments = [];
    existingOpname.data.forEach(item => {
        if (item.selisih !== 0) {
            const adjustmentTransaction = {
                id: Date.now() + Math.random(),
                tanggal: new Date().toISOString().split('T')[0],
                sku: item.sku,
                sparepart: item.sparepart,
                jenis: item.jenis,
                merk: item.merk,
                tipe_transaksi: item.selisih > 0 ? 'masuk' : 'keluar',
                jumlah: Math.abs(item.selisih),
                harga: item.harga,
                keterangan: `Adjustment Stock Opname ${opnameMonth} - ${item.keterangan}`,
                total: Math.abs(item.selisih) * item.harga
            };
            adjustments.push(adjustmentTransaction);
        }
    });

    if (adjustments.length > 0) {
        dailyTransactions.push(...adjustments);
        saveAllData(); // Auto-save dengan backup
        showAlert(`Hasil opname disimpan! ${adjustments.length} adjustment dibuat.`, 'success');
    } else {
        showAlert('Tidak ada perbedaan stock untuk disesuaikan.', 'success');
    }
}

// Export functions
function exportDailyTransactions() {
    const data = dailyTransactions;
    const csv = convertToCSV(data, [
        'tanggal', 'sku', 'sparepart', 'jenis', 'merk', 'tipe_transaksi', 
        'jumlah', 'harga', 'total', 'keterangan'
    ]);
    downloadCSV(csv, 'transaksi_harian.csv');
}

function exportMonthlyReport() {
    const reportMonth = document.getElementById('reportMonth').value;
    const existingReport = monthlyReports.find(r => r.month === reportMonth);
    
    if (!existingReport) {
        showAlert('Generate laporan bulanan terlebih dahulu!', 'error');
        return;
    }

    const csv = convertToCSV(existingReport.data, [
        'sku', 'sparepart', 'jenis', 'merk', 'stockAwal', 'hargaAwal', 'masuk',
        'keluar', 'stockAkhir', 'hargaRataRataWeighted', 'totalValue'
    ]);
    downloadCSV(csv, `laporan_bulanan_${reportMonth}.csv`);
}

function exportOpnameReport() {
    const opnameMonth = document.getElementById('opnameMonth').value;
    const existingOpname = opnameData.find(o => o.month === opnameMonth);
    
    if (!existingOpname) {
        showAlert('Tidak ada data opname untuk di-export!', 'error');
        return;
    }

    const csv = convertToCSV(existingOpname.data, [
        'sku', 'sparepart', 'jenis', 'merk', 'stockSistem', 'stockFisik', 'selisih',
        'harga', 'valueSistem', 'valueFisik', 'keterangan'
    ]);
    downloadCSV(csv, `stock_opname_${opnameMonth}.csv`);
}

function convertToCSV(data, headers) {
    const csvHeaders = headers.join(',');
    const csvData = data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
    ).join('\n');
    
    return csvHeaders + '\n' + csvData;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Data backup and restore functions
function exportAllData() {
    const backupData = {
        dailyTransactions,
        monthlyReports,
        opnameData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `stock-opname-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showAlert('Data backup berhasil di-export!', 'success');
}

function importData() {
    if (!hasPermission('importData')) {
        showAlert('Anda tidak memiliki izin untuk import data!', 'error');
        return;
    }
    document.getElementById('importFile').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm('Import data akan mengganti data yang ada. Lanjutkan?')) {
                if (importedData.dailyTransactions) {
                    dailyTransactions = importedData.dailyTransactions;
                }
                if (importedData.monthlyReports) {
                    monthlyReports = importedData.monthlyReports;
                }
                if (importedData.opnameData) {
                    opnameData = importedData.opnameData;
                }
                
                saveAllData();
                
                // Refresh displays
                updateDailyStatistics();
                displayDailyTransactions();
                displayMonthlyReport();
                displayOpnameData();
                updateSparepartsList();
                
                showAlert(`Data berhasil di-import! Imported: ${importedData.exportedAt || 'Unknown date'}`, 'success');
            }
        } catch (error) {
            showAlert('Error import data: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// CSV Import functions
function importCSV() {
    if (!hasPermission('importCSV')) {
        showAlert('Anda tidak memiliki izin untuk import CSV!', 'error');
        return;
    }
    document.getElementById('importCSVFile').click();
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];
    
    if (lines.length < 2) {
        throw new Error('File CSV harus memiliki minimal header dan 1 baris data');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Expected headers (SKU is optional for backward compatibility)
    const requiredHeaders = ['tanggal', 'sparepart', 'jenis', 'merk', 'tipe_transaksi', 'jumlah', 'harga', 'keterangan'];
    const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.toLowerCase() === h));
    
    if (missingHeaders.length > 0) {
        throw new Error(`Header yang hilang: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = parseCSVLine(line);
        
        if (values.length !== headers.length) {
            throw new Error(`Baris ${i + 1}: Jumlah kolom tidak sesuai dengan header`);
        }

        const row = {};
        headers.forEach((header, index) => {
            row[header.toLowerCase()] = values[index];
        });

        result.push(row);
    }

    return result;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

function validateCSVData(csvData) {
    const errors = [];
    const warnings = [];
    
    csvData.forEach((row, index) => {
        const lineNumber = index + 2; // +2 because index starts at 0 and we skip header
        
        // Validate required fields
        if (!row.tanggal) {
            errors.push(`Baris ${lineNumber}: Tanggal harus diisi`);
        } else {
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(row.tanggal)) {
                errors.push(`Baris ${lineNumber}: Format tanggal harus YYYY-MM-DD (${row.tanggal})`);
            }
        }
        
        if (!row.sparepart || row.sparepart.trim().length < 2) {
            errors.push(`Baris ${lineNumber}: Nama barang harus minimal 2 karakter`);
        }
        
        if (!row.jenis) {
            errors.push(`Baris ${lineNumber}: Jenis harus diisi`);
        }
        
        if (!row.merk || row.merk.trim().length < 1) {
            errors.push(`Baris ${lineNumber}: Merk harus diisi`);
        }
        
        if (!row.tipe_transaksi || !['stock_awal', 'masuk', 'keluar'].includes(row.tipe_transaksi)) {
            errors.push(`Baris ${lineNumber}: Tipe transaksi harus salah satu dari: stock_awal, masuk, keluar`);
        }
        
        const jumlah = parseInt(row.jumlah);
        if (isNaN(jumlah) || jumlah <= 0) {
            errors.push(`Baris ${lineNumber}: Jumlah harus berupa angka positif`);
        }
        
        const harga = parseFloat(row.harga);
        if (row.tipe_transaksi !== 'keluar' && (isNaN(harga) || harga <= 0)) {
            errors.push(`Baris ${lineNumber}: Harga harus berupa angka positif untuk transaksi ${row.tipe_transaksi}`);
        }
    });
    
    return { errors, warnings };
}

function handleImportCSVFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showAlert('File harus berformat CSV!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            const csvData = parseCSV(csvText);
            
            // Validate data
            const validation = validateCSVData(csvData);
            
            if (validation.errors.length > 0) {
                showAlert('Error validasi CSV:\n\n' + validation.errors.join('\n'), 'error');
                return;
            }
            
            // Convert CSV data to transaction format
            const transactions = csvData.map(row => ({
                id: Date.now() + Math.random(),
                tanggal: row.tanggal,
                sku: row.sku ? row.sku.trim().toUpperCase() : '', // Normalize SKU to uppercase
                sparepart: row.sparepart.trim(),
                jenis: row.jenis,
                merk: row.merk.trim(),
                tipe_transaksi: row.tipe_transaksi,
                jumlah: parseInt(row.jumlah),
                harga: parseFloat(row.harga) || 0,
                keterangan: row.keterangan || 'Import CSV',
                total: parseInt(row.jumlah) * (parseFloat(row.harga) || 0)
            }));
            
            // Show confirmation
            const confirmMessage = `Akan mengimport ${transactions.length} transaksi dari CSV.\n\nLanjutkan?`;
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // Add to daily transactions
            dailyTransactions.push(...transactions);
            saveAllData();
            
            // Refresh all displays and statistics
            updateDailyStatistics();
            displayDailyTransactions();
            updateSparepartsList();
            
            showAlert(`Berhasil import ${transactions.length} transaksi dari CSV!`, 'success');
            
        } catch (error) {
            showAlert('Error parsing CSV: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// Delete all data function with multi-step validation
function deleteAllData() {
    if (!hasPermission('deleteAllData')) {
        showAlert('Anda tidak memiliki izin untuk menghapus semua data!', 'error');
        return;
    }
    // Step 1: Initial warning
    const step1 = confirm(
        '\u26A0\uFE0F PERINGATAN KERAS \u26A0\uFE0F\n\n' +
        'Anda akan MENGHAPUS SEMUA DATA termasuk:\n' +
        '• Semua transaksi harian\n' +
        '• Semua laporan bulanan\n' +
        '• Semua data stock opname\n\n' +
        'Data yang dihapus TIDAK DAPAT DIKEMBALIKAN!\n\n' +
        'Pastikan Anda sudah melakukan BACKUP terlebih dahulu.\n\n' +
        'Lanjutkan ke tahap konfirmasi?'
    );
    
    if (!step1) {
        showAlert('Penghapusan data dibatalkan.', 'info');
        return;
    }
    
    // Step 2: Check if user has backup
    const step2 = confirm(
        '\u23FA\uFE0F KONFIRMASI BACKUP\n\n' +
        'Apakah Anda sudah melakukan backup data?\n\n' +
        'Jika belum, silakan klik "Cancel" dan lakukan backup terlebih dahulu dengan tombol "Backup Data".\n\n' +
        'Jika sudah backup, klik "OK" untuk lanjut.'
    );
    
    if (!step2) {
        showAlert('Silakan lakukan backup terlebih dahulu sebelum menghapus data.', 'warning');
        return;
    }
    
    // Step 3: Show current data stats
    const totalTransactions = dailyTransactions.length;
    const totalReports = monthlyReports.length;
    const totalOpname = opnameData.length;
    
    const step3 = confirm(
        '\ud83d\udcca DATA YANG AKAN DIHAPUS:\n\n' +
        `• Transaksi Harian: ${totalTransactions} record\n` +
        `• Laporan Bulanan: ${totalReports} laporan\n` +
        `• Data Stock Opname: ${totalOpname} opname\n\n` +
        'Apakah Anda yakin ingin menghapus SEMUA data ini?\n\n' +
        'Sekali lagi, data yang dihapus TIDAK DAPAT DIKEMBALIKAN!'
    );
    
    if (!step3) {
        showAlert('Penghapusan data dibatalkan.', 'info');
        return;
    }
    
    // Step 4: Final confirmation with typing
    const confirmText = prompt(
        '\u203c\uFE0F KONFIRMASI TERAKHIR \u203c\uFE0F\n\n' +
        'Untuk melanjutkan penghapusan, ketik kata berikut:\n\n' +
        'HAPUS SEMUA DATA\n\n' + 
        '(Ketik persis seperti di atas, huruf besar semua)'
    );
    
    if (confirmText !== 'HAPUS SEMUA DATA') {
        showAlert('Konfirmasi tidak sesuai. Penghapusan data dibatalkan.', 'error');
        return;
    }
    
    // Step 5: Execute deletion
    try {
        // Clear all data arrays
        dailyTransactions.length = 0;
        monthlyReports.length = 0;
        opnameData.length = 0;
        
        // Save empty data to localStorage
        saveAllData();
        
        // Refresh all displays
        updateDailyStatistics();
        displayDailyTransactions();
        displayMonthlyReport();
        displayOpnameData();
        updateSparepartsList();
        
        // Clear all form fields
        document.getElementById('dailyTransactionForm').reset();
        document.getElementById('reportMonth').value = '';
        document.getElementById('opnameMonth').value = '';
        
        showAlert(
            '\u2705 SEMUA DATA BERHASIL DIHAPUS!\n\n' +
            `Dihapus:\n` +
            `• ${totalTransactions} transaksi harian\n` +
            `• ${totalReports} laporan bulanan\n` +
            `• ${totalOpname} data stock opname\n\n` +
            'Sistem sudah bersih dan siap untuk data baru.',
            'success'
        );
        
    } catch (error) {
        showAlert('Error saat menghapus data: ' + error.message, 'error');
    }
}

// Data integrity check
function checkDataIntegrity() {
    const issues = [];
    const duplicates = [];
    const stockIssues = [];
    const priceIssues = [];

    // Group transactions by item (use SKU if available, fallback to name+jenis+merk)
    const itemGroups = {};
    dailyTransactions.forEach(t => {
        const key = t.sku || `${t.sparepart.toLowerCase().trim()}_${t.jenis}_${t.merk.toLowerCase().trim()}`;
        if (!itemGroups[key]) {
            itemGroups[key] = [];
        }
        itemGroups[key].push(t);
    });

    // Check each item group
    Object.keys(itemGroups).forEach(itemKey => {
        const transactions = itemGroups[itemKey];
        const itemName = transactions[0].sparepart;

        // Check for multiple stock_awal
        const stockAwalCount = transactions.filter(t => t.tipe_transaksi === 'stock_awal').length;
        if (stockAwalCount > 1) {
            issues.push(`${itemName}: Memiliki ${stockAwalCount} stock awal`);
        }

        // Check stock calculation
        let currentStock = 0;
        let hasNegativeStock = false;
        transactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)).forEach(t => {
            if (t.tipe_transaksi === 'stock_awal' || t.tipe_transaksi === 'masuk') {
                currentStock += t.jumlah;
            } else if (t.tipe_transaksi === 'keluar') {
                currentStock -= t.jumlah;
                if (currentStock < 0 && !hasNegativeStock) {
                    stockIssues.push(`${itemName}: Stock menjadi negatif pada tanggal ${t.tanggal}`);
                    hasNegativeStock = true;
                }
            }
        });

        // Check for significant price variations
        const prices = transactions.filter(t => t.harga > 0).map(t => t.harga);
        if (prices.length > 1) {
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            if ((maxPrice - minPrice) / avgPrice > 0.5) { // More than 50% variation
                priceIssues.push(`${itemName}: Variasi harga signifikan (Rp ${minPrice} - Rp ${maxPrice})`);
            }
        }
    });

    // Check for duplicate transactions (same item, same type, same date)
    const transactionMap = {};
    dailyTransactions.forEach(t => {
        const key = `${t.tanggal}_${t.sparepart}_${t.tipe_transaksi}`;
        if (!transactionMap[key]) {
            transactionMap[key] = 0;
        }
        transactionMap[key]++;
    });
    Object.keys(transactionMap).forEach(key => {
        if (transactionMap[key] > 1) {
            const [date, name, type] = key.split('_');
            duplicates.push(`Transaksi duplikat untuk ${name} (${type}) pada tanggal ${date}`);
        }
    });

    // Format the report
    let report = 'Laporan Konsistensi Data:\n\n';
    if (issues.length > 0) {
        report += '⚠️ Masalah Umum:\n' + issues.map(i => `- ${i}`).join('\n') + '\n\n';
    }
    if (stockIssues.length > 0) {
        report += '📉 Masalah Stock:\n' + stockIssues.map(i => `- ${i}`).join('\n') + '\n\n';
    }
    if (priceIssues.length > 0) {
        report += '💰 Masalah Harga:\n' + priceIssues.map(i => `- ${i}`).join('\n') + '\n\n';
    }
    if (duplicates.length > 0) {
        report += '🔄 Transaksi Duplikat:\n' + duplicates.map(i => `- ${i}`).join('\n') + '\n\n';
    }

    if (issues.length === 0 && stockIssues.length === 0 && priceIssues.length === 0 && duplicates.length === 0) {
        report += '✅ Tidak ada masalah konsistensi data yang ditemukan.';
        showAlert('Pengecekan selesai. Tidak ada masalah ditemukan.', 'success');
    } else {
        alert(report);
    }
}
