import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Import Alert component
import './DailyView.css';

const DailyView = ({ hasPermission, handleLogout, transactions, loading, error, activeTab, setActiveTab, triggerTransactionsRefresh }) => {
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
        const response = await apiCall('/api/items/suggestions');
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
      const response = await apiCall('/api/transactions/statistics');
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
        response = await apiCall(`/api/transactions/${editingTransactionId}`, 'PUT', transactionData);
      } else {
        response = await apiCall('/api/transactions', 'POST', transactionData);
      }
      
      if (response.success) {
        showAlert(`Transaksi berhasil ${editingTransactionId ? 'diperbarui' : 'disimpan'}!`, 'success');
        resetForm();
        fetchTransactionStats(); // Update stats after transaction
        triggerTransactionsRefresh(); // Trigger re-fetch in App.jsx
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
        const response = await apiCall(`/api/transactions/${id}`, 'DELETE', { confirmDelete: true });
        if (response.success) {
          showAlert('Transaksi berhasil dihapus!', 'success');
          // Re-fetch transactions and stats
          fetchTransactionStats();
          triggerTransactionsRefresh(); // Trigger re-fetch in App.jsx
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

    try {
      const response = await apiCall('/api/auth/clear-data', 'POST', { confirm: 'I_UNDERSTAND_AND_WANT_TO_DELETE_ALL_DATA' });
      if (response.success) {
        showAlert('Semua data transaksi harian berhasil dihapus!', 'success');
        // Re-fetch transactions and stats after clearing data
        fetchTransactionStats();
      } else {
        showAlert('Gagal menghapus data: ' + response.message, 'error');
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
      const response = await apiCall('/api/monthly-reports/generate', 'POST', { reportMonth: reportMonth });
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
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{transactionStats.todayCount}</div>
          <div className="stat-label">Transaksi Hari Ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{transactionStats.totalIn}</div>
          <div className="stat-label">Total Barang Masuk</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{transactionStats.totalOut}</div>
          <div className="stat-label">Total Barang Keluar</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(transactionStats.totalValue)}</div>
          <div className="stat-label">Nilai Transaksi</div>
        </div>
      </div>

      {/* Daily Transaction Form */}
      <div className="form-section">
        <h2>{editingTransactionId ? 'Edit Transaksi' : 'Input Transaksi Harian'}</h2>
        <form id="dailyTransactionForm" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tanggal">Tanggal Transaksi</label>
              <input type="date" id="tanggal" name="tanggal" required value={formData.tanggal} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="sku_daily">SKU</label>
              <input type="text" id="sku_daily" name="sku" required placeholder="Contoh: LP001" value={formData.sku} onChange={handleSkuChange} list="skuList" />
              <datalist id="skuList">
                {skuSuggestions.map(item => (
                  <option key={item.sku} value={item.sku}>
                    {item.name} ({item.brand})
                  </option>
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="sparepart_daily">Nama Barang</label>
              <input type="text" id="sparepart_daily" name="sparepart" required placeholder="Contoh: Laptop" value={formData.sparepart} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="jenis_daily">Jenis/Kategori</label>
              <input type="text" id="jenis_daily" name="jenis" required placeholder="Contoh: Elektronik" value={formData.jenis} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="merk_daily">Merk</label>
              <input type="text" id="merk_daily" name="merk" required placeholder="Contoh: HP" value={formData.merk} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="tipe_transaksi">Tipe Transaksi</label>
              <select id="tipe_transaksi" name="tipe_transaksi" required value={formData.tipe_transaksi} onChange={handleInputChange}>
                <option value="">Pilih Tipe</option>
                <option value="masuk">Barang Masuk</option>
                <option value="keluar">Barang Keluar</option>
                <option value="stock_awal">Stock Awal</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="jumlah">Jumlah</label>
              <input type="number" id="jumlah" name="jumlah" min="0" required value={formData.jumlah} onChange={handleInputChange} />
            </div>
            <div className="form-group" id="hargaGroup">
              <label htmlFor="harga">Harga per Unit</label>
              <input type="number" id="harga" name="harga" min="0" step="0.01" value={formData.harga} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="keterangan">Keterangan</label>
              <input type="text" id="keterangan" name="keterangan" placeholder="Opsional" value={formData.keterangan} onChange={handleInputChange} />
            </div>
          </div>
          <div className="actions">
            <button type="submit" className="daily-view-btn btn-success btn-form-action">{editingTransactionId ? 'Perbarui Transaksi' : 'Simpan Transaksi'}</button>
            <button type="button" className="daily-view-btn btn-form-action" onClick={resetForm}>Reset Form</button>
          </div>
        </form>
      </div>

      {/* Daily Transactions Table */}
      <div className="form-section">
        <h2>Transaksi Harian</h2>
        <div className="controls-section">
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="filterDate">Filter Tanggal</label>
              <input type="date" id="filterDate" name="date" value={filters.date} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label htmlFor="filterSparepart">Filter Nama Barang</label>
              <input type="text" id="filterSparepart" name="sparepart" placeholder="Cari nama barang..." value={filters.sparepart} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label htmlFor="filterType">Filter Tipe</label>
              <select id="filterType" name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">Semua Tipe</option>
                <option value="stock_awal">Stock Awal</option>
                <option value="masuk">Barang Masuk</option>
                <option value="keluar">Barang Keluar</option>
              </select>
            </div>
          </div>
          
          <div className="actions">
            <div className="report-controls">
              <div className="form-group">
                <label htmlFor="reportMonth">Bulan Laporan</label>
                <input
                  type="month"
                  id="reportMonth"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  placeholder="Pilih bulan"
                />
              </div>
              <button className="daily-view-btn btn-info" onClick={exportDailyTransactions}>Export Transaksi</button>
              <button className="daily-view-btn btn-warning" onClick={generateMonthlyReport}>Generate Laporan Bulanan</button>
              {hasPermission('admin') && <button className="daily-view-btn btn-danger" onClick={deleteAllData}>🗑️ Hapus Semua Data</button>}
            </div>
          </div>
        </div>

        <div className="table-container">
          <table id="dailyTransactionsTable">
            <thead>
              <tr>
                <th className="col-tanggal">Tanggal</th>
                <th className="col-sku">SKU</th>
                <th className="col-nama-barang">Nama Barang</th>
                <th className="col-jenis">Jenis</th>
                <th className="col-merk">Merk</th>
                <th className="col-tipe text-center">Tipe</th>
                <th className="col-jumlah text-right">Jumlah</th>
                <th className="col-harga text-right">Harga</th>
                <th className="col-total text-right">Total</th>
                <th className="col-keterangan">Keterangan</th>
                <th className="col-user">User</th>
                <th className="col-actions text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="dailyTransactionsBody">
              {loading ? (
                <tr><td colSpan="12">Memuat transaksi...</td></tr>
              ) : error ? (
                <tr><td colSpan="12" style={{ color: 'red' }}>Error: {error}</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan="12">Tidak ada transaksi ditemukan.</td></tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.tanggal}</td>
                    <td>{t.sku}</td>
                    <td>{t.sparepart}</td>
                    <td>{t.jenis}</td>
                    <td>{t.merk}</td>
                    <td className="text-center"><span className={`badge ${t.tipe_transaksi}`}>{t.tipe_transaksi === 'stock_awal' ? 'STOCK' : (t.tipe_transaksi ? t.tipe_transaksi.replace('_', ' ').toUpperCase() : '')}</span></td>
                    <td className="text-right">{t.jumlah}</td>
                    <td className="text-right">{formatCurrency(t.harga)}</td>
                    <td className="col-total text-right">{formatCurrency(t.total)}</td>
                    <td className="col-keterangan">{t.keterangan}</td>
                    <td>{t.user}</td>
                    <td className="text-center">
                      <div className="button-group">
                        {hasPermission('admin') && <button className="btn daily-view-btn-sm btn-warning" onClick={() => handleEdit(t)}>Edit</button>}
                        {hasPermission('admin') && <button className="btn daily-view-btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Hapus</button>}
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
