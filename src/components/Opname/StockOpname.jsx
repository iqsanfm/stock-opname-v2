import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';


const StockOpname = ({ hasPermission, handleLogout, activeTab, triggerTransactionsRefresh, opnameData: propOpnameData, setTransactions }) => {
  const [opnameMonth, setOpnameMonth] = useState('');
  const [newOpnameMonthInput, setNewOpnameMonthInput] = useState(new Date().toISOString().slice(0, 7));
  const [filterSparepart, setFilterSparepart] = useState('');
  const [localOpnameData, setLocalOpnameData] = useState([]);
  const [availableOpnameMonths, setAvailableOpnameMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  // Fetch available opname months and set default
  useEffect(() => {
    const fetchAvailableOpnameMonths = async () => {
      try {
        const response = await apiCall('/api/stock-opnames/months');
        if (response.success && response.data) {
          setAvailableOpnameMonths(response.data);
          if (response.data.length > 0) {
            setOpnameMonth(response.data[0]); // Set latest month as default
          } else {
            setOpnameMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
          }
        } else {
          showAlert(response.message || 'Gagal memuat daftar bulan opname.', 'error');
          setOpnameMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat memuat daftar bulan opname.', 'error');
          setOpnameMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
        }
      }
    };
    fetchAvailableOpnameMonths();
  }, [handleLogout, showAlert]);

  // Fetch opname data for selected month
  const fetchOpnameData = useCallback(async () => {
    if (!opnameMonth) return;
    setIsLoading(true);
    try {
      const response = await apiCall(`/api/stock-opnames/${opnameMonth}`, 'GET');
      if (response.success && response.data) {
        setLocalOpnameData(response.data || []);
      } else {
        setLocalOpnameData([]);
        showAlert(response.message || 'Tidak ada data opname untuk bulan ini.', 'info');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat memuat data opname.', 'error');
        setLocalOpnameData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [opnameMonth, handleLogout, showAlert]);

  useEffect(() => {
    fetchOpnameData();
  }, [fetchOpnameData]);

  // Sync propOpnameData with localOpnameData
  useEffect(() => {
    if (propOpnameData && Array.isArray(propOpnameData)) {
      setLocalOpnameData(propOpnameData);
    }
  }, [propOpnameData]);

  const filteredOpnameData = useMemo(() => {
    if (!localOpnameData || !Array.isArray(localOpnameData)) {
      return [];
    }
    
    if (!filterSparepart) {
      return localOpnameData;
    }
    
    return localOpnameData.filter(item => 
      item.itemId?.name && 
      item.itemId.name.toLowerCase().includes(filterSparepart.toLowerCase())
    );
  }, [localOpnameData, filterSparepart]);

  const stats = useMemo(() => {
    if (!localOpnameData || !Array.isArray(localOpnameData)) {
      return {
        totalItems: 0,
        totalValue: 0,
        totalIn: 0,
        totalOut: 0
      };
    }
    
    const totalItems = localOpnameData.length;
    const totalValue = localOpnameData.reduce((sum, item) => sum + (item.valueFisik || 0), 0);
    const totalIn = localOpnameData.reduce((sum, item) => (item.selisih > 0 ? item.selisih : 0), 0);
    const totalOut = localOpnameData.reduce((sum, item) => (item.selisih < 0 ? Math.abs(item.selisih) : 0), 0);

    return { totalItems, totalValue, totalIn, totalOut };
  }, [localOpnameData]);

  const formatCurrency = (num) => {
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleMonthChange = (e) => {
    setOpnameMonth(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterSparepart(e.target.value);
  };

  const updateStockFisik = (index, value) => {
    setLocalOpnameData(prev => {
      const newOpnameData = [...prev];
      const item = { ...newOpnameData[index] };
      const stockFisik = parseInt(value) || 0;
      const selisih = stockFisik - item.stockSistem;
      const valueFisik = stockFisik * item.harga;
      newOpnameData[index] = { ...item, stockFisik, selisih, valueFisik };
      return newOpnameData;
    });
  };

  const updateKeterangan = (index, value) => {
    setLocalOpnameData(prev => {
      const newOpnameData = [...prev];
      newOpnameData[index] = { ...newOpnameData[index], keterangan: value };
      return newOpnameData;
    });
  };

  const handleCreateOpname = async () => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk membuat sesi opname!', 'error');
      return;
    }
    // Use newOpnameMonthInput for creating new session
    let monthToCreate = newOpnameMonthInput;

    if (!monthToCreate) { // Fallback if input is somehow empty
      monthToCreate = new Date().toISOString().slice(0, 7);
    }

    // Ensure monthToCreate is in YYYY-MM format
    let formattedMonth = monthToCreate;
    if (!/^\d{4}-\d{2}$/.test(monthToCreate)) {
      try {
        const date = new Date(monthToCreate);
        formattedMonth = date.toISOString().slice(0, 7);
      } catch (e) {
        console.error("Failed to format monthToCreate:", monthToCreate, e);
        showAlert('Format bulan tidak valid. Harap pilih bulan yang benar.', 'error');
        return;
      }
    }

    if (window.confirm(`Yakin ingin membuat sesi stock opname baru untuk ${formattedMonth}? Ini akan mengambil data stok saat ini.`)) {
      try {
        const response = await apiCall('/api/stock-opnames/create', 'POST', { opnameMonth: formattedMonth, copyFromReport: false });
        if (response.success) {
          showAlert('Sesi opname berhasil dibuat!', 'success');
          fetchOpnameData(); // Re-fetch data for the month
          // Also re-fetch available months to ensure the new month appears if it's new
          const monthsResponse = await apiCall('/api/stock-opnames/months');
          if (monthsResponse.success) setAvailableOpnameMonths(monthsResponse.data);
          // After creating, we should also fetch the data for the newly created opname
          // This will trigger fetchOpnameData via useEffect if opnameMonth changes
          // Or directly call setLocalOpnameData if the response contains the data
          if (response.data && response.data.items) { // Assuming create returns the items
            setLocalOpnameData(response.data.items);
          }
        } else {
          showAlert(response.message || 'Gagal membuat sesi opname.', 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat membuat sesi opname.', 'error');
        }
      }
    }
  };

  const handleDeleteOpname = async () => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk menghapus sesi opname!', 'error');
      return;
    }
    if (!opnameMonth) {
      showAlert('Pilih bulan opname untuk dihapus!', 'error');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus sesi stock opname untuk ${opnameMonth}?`)) {
      try {
        const response = await apiCall(`/api/stock-opnames/${opnameMonth}`, 'DELETE');
        if (response.success) {
          showAlert('Sesi opname berhasil dihapus!', 'success');
          setLocalOpnameData([]); // Clear current data
          // Re-fetch available months and set default
          const monthsResponse = await apiCall('/api/stock-opnames/months');
          if (monthsResponse.success) {
            setAvailableOpnameMonths(monthsResponse.data);
            if (monthsResponse.data.length > 0) {
              setOpnameMonth(monthsResponse.data[0]);
            } else {
              setOpnameMonth(new Date().toISOString().slice(0, 7));
            }
          }
        } else {
          showAlert(response.message || 'Gagal menghapus sesi opname.', 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat menghapus sesi opname.', 'error');
        }
      }
    }
  };

  const exportOpnameReport = async () => {
    if (localOpnameData.length === 0) {
      showAlert('Tidak ada data opname untuk di-export!', 'error');
      return;
    }
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/stock-opnames/${opnameMonth}/export`;
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${authToken}`,
      };

      const response = await fetch(url, { headers });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Gagal meng-export laporan stock opname.';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch (_parseError) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        showAlert(errorMessage, 'error');
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `stock_opname_${opnameMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl); // Clean up the URL object

      showAlert('Laporan stock opname berhasil di-export!', 'success');
    } catch (err) {
      showAlert(err.message || 'Terjadi kesalahan saat meng-export laporan stock opname.', 'error');
    }
  };

  const saveOpnameResults = async () => {
    if (!opnameMonth) {
      showAlert('Pilih bulan opname!', 'error');
      return;
    }

    const adjustments = localOpnameData.filter(item => item.selisih !== 0).map(item => ({
      itemId: item._id,
      type: item.selisih > 0 ? 'in' : 'out',
      quantity: Math.abs(item.selisih),
      notes: `Adjustment Stock Opname ${opnameMonth} - ${item.keterangan || ''}`,
      transactionDate: new Date().toISOString().slice(0, 10) // Add transactionDate
    }));

    if (adjustments.length === 0) {
      showAlert('Tidak ada perbedaan stock untuk disesuaikan.', 'info');
      return;
    }

    try {
      const response = await apiCall('/api/stock-opnames/save-results', 'POST', { adjustments, month: opnameMonth });
      if (response.success) {
        showAlert(`Hasil opname disimpan! ${adjustments.length} adjustment dibuat.`, 'success');
        // Re-fetch opname data and available months
        fetchOpnameData();
        const monthsResponse = await apiCall('/api/stock-opnames/months');
        if (monthsResponse.success) setAvailableOpnameMonths(monthsResponse.data);
        // Also re-fetch transactions in App.jsx to reflect adjustments
        // This assumes setTransactions is passed down from App.jsx
        if (setTransactions) {
          // A more robust solution would be to trigger a fetch in App.jsx
          // For now, we'll just clear it to force a re-fetch on next DailyView load
          // setTransactions([]); 
          triggerTransactionsRefresh(); // Trigger re-fetch in App.jsx
          setLocalOpnameData([]); // Clear local opname data after saving results
        }
      } else {
        showAlert('Gagal menyimpan hasil opname: ' + response.message, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert('Terjadi kesalahan saat menyimpan hasil opname.', 'error');
      }
      console.error("Failed to save opname results", err);
    }
  };

  if (activeTab !== 'stock-opname') {
    return null;
  }

  return (
    <div className="opname-tab">
      
      
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
      
      {/* Opname Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{stats.totalItems}</div>
          <div className="text-sm">Items di Opname</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <div className="text-sm">Total Value Opname</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{stats.totalIn}</div>
          <div className="text-sm">Selisih Lebih</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">{stats.totalOut}</div>
          <div className="text-sm">Selisih Kurang</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <div className="flex flex-wrap justify-between items-start mb-6 gap-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="mb-4">
              <label htmlFor="opnameMonth" className="block text-gray-700 text-sm font-bold mb-2">Bulan Opname</label>
              <select 
                id="opnameMonth" 
                value={opnameMonth} 
                onChange={handleMonthChange} 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                {availableOpnameMonths.length > 0 ? (
                  availableOpnameMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))
                ) : (
                  <option value="">Tidak ada sesi opname tersedia</option>
                )}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="filterOpnameSparepart" className="block text-gray-700 text-sm font-bold mb-2">Filter Nama Barang</label>
              <input 
                type="text" 
                id="filterOpnameSparepart" 
                placeholder="Cari nama barang..." 
                value={filterSparepart} 
                onChange={handleFilterChange} 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {hasPermission('admin') && (
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label htmlFor="newOpnameMonth" className="block text-gray-700 text-sm font-bold mb-2">Bulan Sesi Baru</label>
                  <input
                    type="month"
                    id="newOpnameMonth"
                    value={newOpnameMonthInput}
                    onChange={(e) => setNewOpnameMonthInput(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={handleCreateOpname}>
                  Buat Sesi Opname Baru
                </button>
              </div>
            )}
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={exportOpnameReport}>Export Stock Opname</button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={saveOpnameResults}>Simpan Hasil Opname</button>
            {hasPermission('admin') && (
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={handleDeleteOpname}>
                Hapus Sesi Opname
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
          {isLoading ? (
            <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Memuat data opname...</div>
          ) : localOpnameData.length === 0 ? (
            <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
              <p>Tidak ada data opname untuk bulan ini.</p>
              {hasPermission('admin') && <p>Gunakan tombol "Buat Sesi Opname Baru" untuk memulai.</p>}
            </div>
          ) : (
            <table id="opnameTable" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nama Barang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Merk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Stock Sistem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Stock Fisik (Input)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Selisih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Value Sistem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Value Fisik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Keterangan</th>
                </tr>
              </thead>
              <tbody id="opnameBody">
                {filteredOpnameData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">{item.itemId?.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">{item.itemId?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">{item.itemId?.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">{item.itemId?.brand || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis text-right">{item.stockSistem}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">
                      <input 
                        type="number" 
                        value={item.stockFisik || ''} 
                        min="0" 
                        onChange={(e) => updateStockFisik(index, e.target.value)} 
                        className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                      />
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis text-right ${item.selisih > 0 ? 'text-green-600' : item.selisih < 0 ? 'text-red-600' : ''}`}>
                      {item.selisih || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis text-right">{formatCurrency(item.valueSistem)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis text-right">{formatCurrency(item.valueFisik)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis">
                      <input 
                        type="text" 
                        value={item.keterangan || ''} 
                        onChange={(e) => updateKeterangan(index, e.target.value)} 
                        className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                        placeholder="Keterangan..." 
                      />
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockOpname;
