import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Import Alert component

const DailyView = ({ hasPermission, handleLogout, transactions, loading, error, activeTab, setActiveTab, triggerTransactionsRefresh, triggerItemsRefresh }) => {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    sku: '',
    itemId: '',
    sparepart: '',
    jenis: '',
    merk: '',
    tipe_transaksi: '',
    jumlah: '',
    harga: '',
    keterangan: ''
  });
  const [filters, setFilters] = useState({
    date: '',
    sparepart: '',
    type: ''
  });
  const [skuSuggestions, setSkuSuggestions] = useState([]);
  const [reportMonth, setReportMonth] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState(null); // State for editing
  const [transactionStats, setTransactionStats] = useState({
    todayCount: 0,
    totalIn: 0,
    totalOut: 0,
    totalValue: 0
  });
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  // Fetch SKU suggestions on component mount
  useEffect(() => {
    const fetchSkuSuggestions = async () => {
      try {
        const response = await apiCall('api/items?limit=0');
        if (response.success) {
          setSkuSuggestions(response.data);
        } else {
          console.error('Failed to fetch SKU suggestions:', response.message);
        }
      } catch (error) {
        console.error('Error fetching SKU suggestions:', error);
      }
    };
    fetchSkuSuggestions();
  }, []);

  // Fetch transaction statistics from backend
  const fetchTransactionStats = useCallback(async () => {
    try {
      const response = await apiCall('api/transactions/statistics');
      if (response.success) {
        const dailyStats = response.data.dailyStats || [];
        let todayCount = 0;
        let totalIn = 0;
        let totalOut = 0;
        let totalValue = 0;

        dailyStats.forEach(stat => {
          todayCount += stat.count || 0;
          totalValue += stat.totalValue || 0;

          if (stat._id === 'masuk') {
            totalIn += stat.totalQuantity || 0;
          } else if (stat._id === 'keluar') {
            totalOut += stat.totalQuantity || 0;
          }
        });

        setTransactionStats({
          todayCount: todayCount,
          totalIn: totalIn,
          totalOut: totalOut,
          totalValue: totalValue,
        });
      } else {
        console.error('Failed to fetch transaction statistics:', response.message);
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        console.error('Error fetching transaction statistics:', err);
      }
    }
  }, [handleLogout]);

  useEffect(() => {
    fetchTransactionStats();
  }, [fetchTransactionStats]);

  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    const filtered = transactions.filter(t => {
        const dateMatch = filters.date ? t.tanggal === filters.date : true;
        const sparepartMatch = filters.sparepart ? (t.sparepart && t.sparepart.toLowerCase().includes(filters.sparepart.toLowerCase())) : true;
        const typeMatch = filters.type ? t.tipe_transaksi === filters.type : true;
        return dateMatch && sparepartMatch && typeMatch;
    });
    return filtered;
  }, [transactions, filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkuChange = (e) => {
    const selectedSku = e.target.value;
    
    const foundItem = skuSuggestions.find(item => item.sku === selectedSku);
    
    setFormData(prev => ({
      ...prev,
      sku: selectedSku,
      itemId: foundItem ? foundItem.id : '',
      sparepart: foundItem ? foundItem.name : '',
      jenis: foundItem ? foundItem.category : '',
      merk: foundItem ? foundItem.brand : '',
      harga: foundItem ? (foundItem.averagePrice || '') : ''
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      sku: '',
      itemId: '',
      sparepart: '',
      jenis: '',
      merk: '',
      tipe_transaksi: '',
      jumlah: '',
      harga: '',
      keterangan: ''
    });
    setEditingTransactionId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // window.alert(`DEBUG: Harga yang akan dikirim: ${formData.harga}`); // DEBUG
    
    if (!formData.itemId || !formData.tipe_transaksi || !formData.jumlah) {
      showAlert('Mohon lengkapi data transaksi!', 'error');
      return;
    }
    
    const transactionData = {
      itemId: formData.itemId,
      transactionType: (() => {
        switch (formData.tipe_transaksi) {
          case 'masuk':
            return 'masuk';
          case 'keluar':
            return 'keluar';
          case 'stock_awal':
            return 'stock_awal';
          default:
            return '';
        }
      })(),
      quantity: parseInt(formData.jumlah, 10) || 0,
      unitPrice: parseFloat(formData.harga) || 0,
      notes: formData.keterangan || '',
      transactionDate: formData.tanggal
    };

    try {
      let response;
      if (editingTransactionId) {
        response = await apiCall(`api/transactions/${editingTransactionId}`, 'PUT', transactionData);
      } else {
        response = await apiCall('api/transactions', 'POST', transactionData);
      }
      
      if (response.success) {
        showAlert(`Transaksi berhasil ${editingTransactionId ? 'diperbarui' : 'disimpan'}!`, 'success');
        resetForm();
        fetchTransactionStats(); // Update stats after transaction
        triggerTransactionsRefresh(); // Trigger re-fetch in App.jsx
        triggerItemsRefresh();
      } else {
        showAlert('Gagal menyimpan transaksi: ' + response.message, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat menyimpan transaksi.', 'error');
      }
      console.error("Failed to save transaction", err);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransactionId(transaction.id);
    setFormData({
      tanggal: transaction.tanggal,
      sku: transaction.sku,
      itemId: transaction.itemId, // Assuming itemId is available in the mapped transaction
      sparepart: transaction.sparepart,
      jenis: transaction.jenis,
      merk: transaction.merk,
      tipe_transaksi: transaction.tipe_transaksi,
      jumlah: transaction.jumlah,
      harga: transaction.harga, // Use harga from the transaction
      keterangan: transaction.keterangan
    });
  };

  const handleDelete = async (id) => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk menghapus data!', 'error');
      return;
    }
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      try {
        const response = await apiCall(`api/transactions/${id}`, 'DELETE', { confirmDelete: true });
        if (response.success) {
          showAlert('Transaksi berhasil dihapus!', 'success');
          // Re-fetch transactions and stats
          fetchTransactionStats();
          triggerTransactionsRefresh(); // Trigger re-fetch in App.jsx
        triggerItemsRefresh();
        } else {
          showAlert('Gagal menghapus transaksi: ' + response.message, 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat menghapus transaksi.', 'error');
        }
        console.error("Failed to delete transaction", err);
      }
    }
  }

  const formatCurrency = (num) => {
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  const exportDailyTransactions = () => {
    const data = transactions;
    const csvHeaders = ['Tanggal', 'SKU', 'Nama Barang', 'Jenis', 'Merk', 'Tipe', 'Jumlah', 'Harga', 'Total', 'Keterangan'];
    const csvData = data.map(t => [
      t.tanggal,
      t.sku,
      t.sparepart,
      t.jenis,
      t.merk,
      t.tipe_transaksi,
      t.jumlah,
      t.harga,
      t.total,
      t.keterangan
    ].map(field => `"${field}"`).join(',')).join('\n');
    
    const csv = csvHeaders.join(',') + '\n' + csvData;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transaksi_harian.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAlert('Transaksi harian berhasil di-export!', 'success');
  };

  const deleteAllData = async () => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk menghapus semua data!', 'error');
      return;
    }

    const confirmText = prompt(
      '\u203c\uFE0F KONFIRMASI TERAKHIR \u203c\uFE0F\n\n' +
      'Untuk melanjutkan penghapusan, ketik kata berikut:\n\n' +
      'HAPUS SEMUA DATA\n\n' +
      '(Ketik persis seperti di atas, huruf besar semua)'
    );

    if (confirmText !== 'HAPUS SEMUA DATA') {
      showAlert('Konfirmasi tidak sesuai. Penghapusan data dibatalkan.', 'info');
      return;
    }

    const password = prompt('Untuk konfirmasi final, masukkan password Anda:');
    if (!password) {
      showAlert('Password tidak dimasukkan. Penghapusan dibatalkan.', 'info');
      return;
    }

    try {
      const response = await apiCall('api/auth/clear-data', 'POST', { password: password, confirm: 'I_UNDERSTAND_AND_WANT_TO_DELETE_ALL_DATA' });
      
      if (response.success) {
        showAlert('Semua data transaksi harian berhasil dihapus!', 'success');
        // Re-fetch transactions and stats after clearing data
        fetchTransactionStats();
        triggerTransactionsRefresh(); // Refresh the main transaction list in App.jsx
      } else {
        // Show specific error message from backend
        showAlert(`Gagal menghapus data: ${response.message}`, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat menghapus data.', 'error');
      }
      console.error("Failed to delete all data", err);
    }
  };

  const generateMonthlyReport = async () => {
    if (!reportMonth) {
      showAlert('Pilih bulan untuk generate laporan!', 'error');
      return;
    }
    try {
      const response = await apiCall('api/monthly-reports/generate', 'POST', { reportMonth: reportMonth });
      if (response.success) {
        showAlert('Laporan bulanan berhasil di-generate!', 'success');
        setActiveTab('monthly');
      } else {
        showAlert('Gagal generate laporan bulanan: ' + response.message, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat generate laporan bulanan.', 'error');
      }
      console.error("Failed to generate monthly report", err);
    }
  };

  const tabClassName = `tab-content ${activeTab === 'daily' ? 'active' : ''}`;
  return (
    <div id="dailyTab" className={`${tabClassName} daily-view`}>
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}

      {/* Daily Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{transactionStats.todayCount}</div>
          <div className="text-sm">Transaksi Hari Ini</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{transactionStats.totalIn}</div>
          <div className="text-sm">Total Barang Masuk</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{transactionStats.totalOut}</div>
          <div className="text-sm">Total Barang Keluar</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{formatCurrency(transactionStats.totalValue)}</div>
          <div className="text-sm">Nilai Transaksi</div>
        </div>
      </div>

      {/* Daily Transaction Form */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingTransactionId ? 'Edit Transaksi' : 'Input Transaksi Harian'}</h2>
        <form id="dailyTransactionForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">Tanggal Transaksi</label>
              <input type="date" id="tanggal" name="tanggal" required value={formData.tanggal} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="sku_daily" className="block text-sm font-medium text-gray-700">SKU</label>
              <input type="text" id="sku_daily" name="sku" required placeholder="Contoh: LP001" value={formData.sku} onChange={handleSkuChange} list="skuList" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              <datalist id="skuList">
                {skuSuggestions.map(item => (
                  <option key={item.sku} value={item.sku}>
                    {item.name} ({item.brand})
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="sparepart_daily" className="block text-sm font-medium text-gray-700">Nama Barang</label>
              <input type="text" id="sparepart_daily" name="sparepart" required placeholder="Contoh: Laptop" value={formData.sparepart} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="jenis_daily" className="block text-sm font-medium text-gray-700">Jenis/Kategori</label>
              <input type="text" id="jenis_daily" name="jenis" required placeholder="Contoh: Elektronik" value={formData.jenis} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="merk_daily" className="block text-sm font-medium text-gray-700">Merk</label>
              <input type="text" id="merk_daily" name="merk" required placeholder="Contoh: HP" value={formData.merk} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="tipe_transaksi" className="block text-sm font-medium text-gray-700">Tipe Transaksi</label>
              <select id="tipe_transaksi" name="tipe_transaksi" required value={formData.tipe_transaksi} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Pilih Tipe</option>
                <option value="masuk">Barang Masuk</option>
                <option value="keluar">Barang Keluar</option>
                <option value="stock_awal">Stock Awal</option>
              </select>
            </div>
            <div>
              <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700">Jumlah</label>
              <input type="number" id="jumlah" name="jumlah" min="0" required value={formData.jumlah} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div id="hargaGroup">
              <label htmlFor="harga" className="block text-sm font-medium text-gray-700">Harga per Unit</label>
              <input type="number" id="harga" name="harga" min="0" step="0.01" value={formData.harga} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700">Keterangan</label>
              <input type="text" id="keterangan" name="keterangan" placeholder="Opsional" value={formData.keterangan} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap items-center mt-6">
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">{editingTransactionId ? 'Perbarui Transaksi' : 'Simpan Transaksi'}</button>
            <button type="button" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={resetForm}>Reset Form</button>
          </div>
        </form>
      </div>

      {/* Daily Transactions Table */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaksi Harian</h2>
        <div className="flex flex-wrap justify-between items-start mb-6 gap-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="mb-4">
              <label htmlFor="filterDate" className="block text-gray-700 text-sm font-bold mb-2">Filter Tanggal</label>
              <input type="date" id="filterDate" name="date" value={filters.date} onChange={handleFilterChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
              <label htmlFor="filterSparepart" className="block text-gray-700 text-sm font-bold mb-2">Filter Nama Barang</label>
              <input type="text" id="filterSparepart" name="sparepart" placeholder="Cari nama barang..." value={filters.sparepart} onChange={handleFilterChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
              <label htmlFor="filterType" className="block text-gray-700 text-sm font-bold mb-2">Filter Tipe</label>
              <select id="filterType" name="type" value={filters.type} onChange={handleFilterChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <option value="">Semua Tipe</option>
                <option value="stock_awal">Stock Awal</option>
                <option value="masuk">Barang Masuk</option>
                <option value="keluar">Barang Keluar</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label htmlFor="reportMonth" className="block text-gray-700 text-sm font-bold mb-2">Bulan Laporan</label>
                <input
                  type="month"
                  id="reportMonth"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  placeholder="Pilih bulan"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={exportDailyTransactions}>Export Transaksi</button>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={generateMonthlyReport}>Generate Laporan Bulanan</button>
              {hasPermission('admin') && <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={deleteAllData}>🗑️ Hapus Semua Data</button>}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
          <table id="dailyTransactionsTable" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-20">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-20">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Nama Barang</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-20">Jenis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-20">Merk</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-18">Tipe</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-18">Jumlah</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">Harga</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-36">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-24">User</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody id="dailyTransactionsBody">
              {loading ? (
                <tr><td colSpan="12" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Memuat transaksi...</td></tr>
              ) : error ? (
                <tr><td colSpan="12" className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">Error: {error}</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan="12" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Tidak ada transaksi ditemukan.</td></tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-20">{t.tanggal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-20">{t.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32">{t.sparepart}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-20">{t.jenis}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-20">{t.merk}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-18 text-center"><span className={`badge ${t.tipe_transaksi}`}>{t.tipe_transaksi === 'stock_awal' ? 'STOCK' : (t.tipe_transaksi ? t.tipe_transaksi.replace('_', ' ').toUpperCase() : '')}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-18 text-right">{t.jumlah}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-24 text-right">{formatCurrency(t.harga)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32 text-right">{formatCurrency(t.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-36">{t.keterangan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-24">{t.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32 text-center">
                      <div className="flex gap-2 justify-center items-center">
                        {hasPermission('admin') && <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium" onClick={() => handleEdit(t)}>Edit</button>}
                        {hasPermission('admin') && <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium" onClick={() => handleDelete(t.id)}>Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyView;
