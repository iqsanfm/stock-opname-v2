import { useState, useEffect, useCallback } from 'react';
import AuthModal from './components/Auth/AuthModal';
import DailyView from './components/Transaction/DailyView';
import MonthlyReports from './components/Reports/MonthlyReports';
import StockOpname from './components/Opname/StockOpname';
import ItemList from './components/Items/ItemList';
import ProfileSettings from './components/Auth/ProfileSettings';
import UserManagement from './components/Admin/UserManagement';
import RecipeManagement from './components/Recipes/RecipeManagement';
import apiCall from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]); // Lifted state for transactions
  const [loading, setLoading] = useState(true); // Loading state for transactions
  const [error, setError] = useState(null); // Error state for transactions
  const [opnameData, setOpnameData] = useState([]); // State for stock opname data
  const [items, setItems] = useState([]);
  const [itemsPagination, setItemsPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState(null);
  const [activeTab, setActiveTab] = useState('daily'); // daily, monthly, opname
  const [refreshTransactionsTrigger, setRefreshTransactionsTrigger] = useState(0); // Trigger for re-fetching transactions
  const [refreshItemsTrigger, setRefreshItemsTrigger] = useState(0);

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
          itemId: t.itemId ? t.itemId._id : '',
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
          user: t.userId ? t.userId.username : 'N/A',
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

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    setErrorItems(null);
    try {
      const params = new URLSearchParams({
        page: itemsPagination.currentPage,
        limit: itemsPagination.itemsPerPage,
      });
      const response = await apiCall(`/api/items?${params.toString()}`);
      if (response.success) {
        setItems(Array.isArray(response.data) ? response.data : []);
        setItemsPagination(prev => ({
          ...prev,
          totalItems: response.pagination && typeof response.pagination.total === 'number' ? response.pagination.total : 0,
        }));
      } else {
        setErrorItems('Gagal memuat item: ' + response.message);
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setErrorItems('Terjadi kesalahan saat memuat item.');
      }
      console.error("Failed to fetch items:", err);
    } finally {
      setLoadingItems(false);
    }
  }, [handleLogout, itemsPagination.currentPage, itemsPagination.itemsPerPage]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated, fetchTransactions, refreshTransactionsTrigger]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [isAuthenticated, fetchItems, refreshItemsTrigger]);

  const triggerTransactionsRefresh = useCallback(() => {
    setRefreshTransactionsTrigger(prev => prev + 1);
  }, []);

  const triggerItemsRefresh = useCallback(() => {
    setRefreshItemsTrigger(prev => prev + 1);
  }, []);

  const handleItemsPageChange = (page) => {
    setItemsPagination(prev => ({ ...prev, currentPage: page }));
  };

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
          triggerItemsRefresh={triggerItemsRefresh}
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
          hasPermission={hasPermission} 
          handleLogout={handleLogout} 
          activeTab={activeTab}
          items={items}
          loading={loadingItems}
          error={errorItems}
          pagination={itemsPagination}
          onPageChange={handleItemsPageChange}
          triggerItemsRefresh={triggerItemsRefresh}
        />;
      case 'profile-settings':
        return <ProfileSettings
          user={user}
          handleLogout={handleLogout}
          hasPermission={hasPermission}
        />;
      case 'user-management':
        return <UserManagement
          handleLogout={handleLogout}
        />;
      case 'recipes':
        return <RecipeManagement
          hasPermission={hasPermission}
          handleLogout={handleLogout}
          activeTab={activeTab}
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
          triggerItemsRefresh={triggerItemsRefresh}
        />;
    }
  };

  const MainApp = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg rounded-lg p-8 mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Stock Opname System</h1>
        <p className="text-indigo-200 text-lg">Sistem Manajemen Inventory dengan Transaksi Harian & Akumulasi Bulanan</p>
      </header>
      <main className="bg-white shadow-md rounded-lg p-6">
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button 
            className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
              ${activeTab === 'daily' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            Transaksi Harian
          </button>
          <button 
            className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
              ${activeTab === 'monthly' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            Laporan Bulanan
          </button>
          <button 
            className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
              ${activeTab === 'stock-opname' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
            onClick={() => setActiveTab('stock-opname')}
          >
            Stock Opname
          </button>
          <button 
            className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
              ${activeTab === 'items' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Daftar Item
          </button>
          {hasPermission('admin') && (
            <button 
              className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
                ${activeTab === 'user-management' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
              onClick={() => setActiveTab('user-management')}
            >
              Manajemen Pengguna
            </button>
          )}
          {hasPermission('admin') && (
            <button 
              className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
                ${activeTab === 'recipes' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              Manajemen Resep
            </button>
          )}
          <button 
            className={`px-4 py-2 text-gray-500 font-medium rounded-t-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-all duration-300
              ${activeTab === 'profile-settings' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : ''}`}
            onClick={() => setActiveTab('profile-settings')}
          >
            Pengaturan Profil
          </button>
        </div>
        {renderTabContent()}
      </main>
      <div className="text-center text-gray-500 text-sm mt-8">Powered By SigmaTech</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <AuthModal onLogin={handleLogin} />
      ) : (
        <MainApp />
      )}
    </div>
  );
}

export default App;
