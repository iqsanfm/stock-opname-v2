import { useState, useEffect, useCallback } from 'react';
import './App.css';
import AuthModal from './components/Auth/AuthModal';
import DailyView from './components/Transaction/DailyView';
import MonthlyReports from './components/Reports/MonthlyReports';
import StockOpname from './components/Opname/StockOpname';
import ItemList from './components/Items/ItemList'; // Import ItemList
import ProfileSettings from './components/Auth/ProfileSettings'; // Import ProfileSettings
import apiCall from './services/api'; // Import apiCall

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]); // Lifted state for transactions
  const [loading, setLoading] = useState(true); // Loading state for transactions
  const [error, setError] = useState(null); // Error state for transactions
  const [opnameData, setOpnameData] = useState([]); // State for stock opname data
  const [activeTab, setActiveTab] = useState('daily'); // daily, monthly, opname
  const [refreshTransactionsTrigger, setRefreshTransactionsTrigger] = useState(0); // Trigger for re-fetching transactions

  // Check for saved user data on initial load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedAuthToken = localStorage.getItem('authToken');
      if (savedUser && savedAuthToken) {
        const parsedUser = JSON.parse(savedUser);
        setUser({ ...parsedUser, token: savedAuthToken });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      // Clear potentially corrupted data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('authToken', userData.token || ''); // Store token
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setActiveTab('daily'); // Reset to default tab on logout
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall('/api/transactions');
      if (response.success) {
        const mappedTransactions = response.data.map(t => ({
          id: t.id,
          tanggal: t.transactionDate ? t.transactionDate.split('T')[0] : '',
          sku: t.itemId ? t.itemId.sku : '',
          sparepart: t.itemId ? t.itemId.name : '',
          jenis: t.itemId ? t.itemId.category : '',
          merk: t.itemId ? t.itemId.brand : '',
          tipe_transaksi: t.transactionType || '',
          jumlah: t.quantity || 0,
          harga: t.unitPrice || 0,
          total: t.totalPrice || 0,
          keterangan: t.notes || '',
        }));
        setTransactions(mappedTransactions);
      } else {
        setError('Gagal memuat transaksi: ' + response.message);
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setError('Terjadi kesalahan saat memuat transaksi.');
      }
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTransactionsTrigger]); // Dependency on fetchTransactions and trigger

  const triggerTransactionsRefresh = useCallback(() => {
    setRefreshTransactionsTrigger(prev => prev + 1);
  }, []);

  // Role-based access control utility
  const hasPermission = (requiredRole) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has all permissions
    return user.role === requiredRole;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'daily':
        return <DailyView 
          hasPermission={hasPermission} 
          handleLogout={handleLogout} 
          transactions={transactions} 
          setTransactions={setTransactions} 
          loading={loading} 
          error={error} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          triggerTransactionsRefresh={triggerTransactionsRefresh}
        />;
      case 'monthly':
        return <MonthlyReports 
          user={user} 
          hasPermission={hasPermission} 
          handleLogout={handleLogout} 
          transactions={transactions} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          opnameData={opnameData}
          setOpnameData={setOpnameData}
        />;
      case 'stock-opname':
        return <StockOpname 
          user={user} 
          hasPermission={hasPermission} 
          handleLogout={handleLogout} 
          opnameData={opnameData} 
          setOpnameData={setOpnameData} 
          setTransactions={setTransactions}
          activeTab={activeTab}
          triggerTransactionsRefresh={triggerTransactionsRefresh}
        />;
      case 'items':
        return <ItemList 
          user={user} 
          hasPermission={hasPermission} 
          handleLogout={handleLogout} 
          activeTab={activeTab}
        />;
      case 'profile-settings':
        return <ProfileSettings
          user={user}
          handleLogout={handleLogout}
          hasPermission={hasPermission}
        />;
      default:
        return <DailyView 
          hasPermission={hasPermission} 
          handleLogout={handleLogout} 
          transactions={transactions} 
          setTransactions={setTransactions} 
          loading={loading} 
          error={error} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          triggerTransactionsRefresh={triggerTransactionsRefresh}
        />;
    }
  };

  const MainApp = () => (
    <div className="container">
      <header className="header">
        <h1>Stock Opname System</h1>
        <p>Sistem Manajemen Inventory dengan Transaksi Harian & Akumulasi Bulanan</p>
      </header>
      <main className="main-content">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            Transaksi Harian
          </button>
          <button 
            className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            Laporan Bulanan
          </button>
          <button 
            className={`tab-button ${activeTab === 'stock-opname' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock-opname')}
          >
            Stock Opname
          </button>
          <button 
            className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Daftar Item
          </button>
          <button 
            className={`tab-button ${activeTab === 'profile-settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile-settings')}
          >
            Pengaturan Profil
          </button>
        </div>
        {renderTabContent()}
      </main>
      <div className="footer-text">Powered By SigmaTech</div>
    </div>
  );

  return (
    <div className="app">
      {!isAuthenticated ? (
        <AuthModal onLogin={handleLogin} />
      ) : (
        <MainApp />
      )}
    </div>
  );
}

export default App;