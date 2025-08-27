import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';
import './MonthlyReports.css';

const MonthlyReports = ({ user, hasPermission, handleLogout, activeTab, setActiveTab, setOpnameData }) => {
  const [reportMonth, setReportMonth] = useState('');
  const [filterSparepart, setFilterSparepart] = useState('');
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [reportSummary, setReportSummary] = useState(null);

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  // Fetch available months and set default report month
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await apiCall('/api/monthly-reports/months');
        if (response.success && response.data) {
          setAvailableMonths(response.data);
          if (response.data.length > 0) {
            // Set the latest month as default
            setReportMonth(response.data[0]);
          } else {
            // If no months, set current month as default for generation
            setReportMonth(new Date().toISOString().slice(0, 7));
          }
        } else {
          showAlert(response.message || 'Gagal memuat daftar bulan laporan.', 'error');
          setReportMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat memuat daftar bulan laporan.', 'error');
          setReportMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
        }
      }
    };

    if (activeTab === 'monthly') {
      fetchAvailableMonths();
    }
  }, [activeTab, handleLogout, showAlert]);

  // Fetch monthly report data when reportMonth changes
  const fetchMonthlyReport = useCallback(async () => {
    if (!reportMonth) return;
    setLoading(true);
    setError(null);
    setReportSummary(null); // Reset summary on new fetch
    try {
      const response = await apiCall(`/api/monthly-reports/${reportMonth}`);
      if (response.success && response.data) {
        // Handle cases where data is the array or is in data.items
        const items = Array.isArray(response.data) ? response.data : response.data.items;
        setMonthlyReportData(items || []);
        
        // Set summary if it exists
        if (response.summary) {
          setReportSummary(response.summary);
        }
      } else {
        setMonthlyReportData([]);
        showAlert(response.message || 'Tidak ada data laporan untuk bulan ini.', 'info');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setError(err.message || 'Terjadi kesalahan saat memuat laporan bulanan.');
        setMonthlyReportData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [reportMonth, handleLogout, showAlert]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [fetchMonthlyReport]);

  

  const formatCurrency = (num) => {
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleMonthChange = (e) => {
    setReportMonth(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterSparepart(e.target.value);
  };

  const filteredMonthlyData = useMemo(() => {
    if (!monthlyReportData) return [];
    if (!filterSparepart) return monthlyReportData;
    return monthlyReportData.filter(item =>
      item.itemId?.name && item.itemId.name.toLowerCase().includes(filterSparepart.toLowerCase())
    );
  }, [monthlyReportData, filterSparepart]);

  const exportMonthlyReport = async () => {
    if (monthlyReportData.length === 0) {
      showAlert('Tidak ada data laporan untuk di-export!', 'error');
      return;
    }
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/monthly-reports/${reportMonth}/export`;
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
        let errorMessage = 'Gagal meng-export laporan bulanan.';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch (parseError) {
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
      a.download = `laporan_bulanan_${reportMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl); // Clean up the URL object

      showAlert('Laporan bulanan berhasil di-export!', 'success');
    } catch (err) {
      showAlert(err.message || 'Terjadi kesalahan saat meng-export laporan bulanan.', 'error');
    }
  };

  const handleDeleteReport = async () => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk menghapus laporan!', 'error');
      return;
    }
    if (!reportMonth) {
      showAlert('Pilih bulan laporan untuk dihapus!', 'error');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus laporan bulanan untuk ${reportMonth}?`)) {
      try {
        const response = await apiCall(`/api/monthly-reports/${reportMonth}`, 'DELETE');
        if (response.success) {
          showAlert('Laporan berhasil dihapus!', 'success');
          // Re-fetch available months and reports
          // This will also reset the selected month if the deleted one was selected
          const fetchAvailableMonths = async () => {
            try {
              const monthsResponse = await apiCall('/api/monthly-reports/months');
              if (monthsResponse.success && monthsResponse.data) {
                setAvailableMonths(monthsResponse.data);
                if (monthsResponse.data.length > 0) {
                  setReportMonth(monthsResponse.data[0]);
                } else {
                  setReportMonth(new Date().toISOString().slice(0, 7));
                }
              }
            } catch (err) {
              console.error('Error re-fetching months:', err);
            }
          };
          fetchAvailableMonths();
        } else {
          showAlert(response.message || 'Gagal menghapus laporan.', 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat menghapus laporan.', 'error');
        }
      }
    }
  };

  const copyToOpname = () => {
    if (!reportMonth) {
      showAlert('Pilih bulan untuk copy ke stock opname!', 'error');
      return;
    }
    if (monthlyReportData.length === 0) {
      showAlert('Tidak ada data laporan untuk dicopy ke stock opname!', 'error');
      return;
    }

    const opnameMonth = reportMonth;
    const opnameItems = monthlyReportData.map(item => ({
        sku: item.itemId?.sku,
        sparepart: item.itemId?.name,
        jenis: item.itemId?.category,
        merk: item.itemId?.brand,
        stockSistem: item.stockAkhir,
        stockFisik: item.stockAkhir, // Default to system stock
        selisih: 0,
        harga: item.hargaRataRata,
        valueSistem: item.totalValue,
        valueFisik: item.totalValue,
        keterangan: ''
    }));

    setOpnameData(prev => {
      const existingOpnameIndex = prev.findIndex(o => o.month === opnameMonth);
      if (existingOpnameIndex >= 0) {
        const newOpnameData = [...prev];
        newOpnameData[existingOpnameIndex] = { month: opnameMonth, data: opnameItems };
        return newOpnameData;
      } else {
        return [...prev, { month: opnameMonth, data: opnameItems }];
      }
    });

    showAlert('Data berhasil dicopy ke stock opname!', 'success');
    setActiveTab('stock-opname');
  };

  const tabClassName = `tab-content ${activeTab === 'monthly' ? 'active' : ''}`;
  return (
    <div id="monthlyTab" className={tabClassName}>
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}

      {/* Monthly Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{reportSummary?.totalStockAkhir || 0}</div>
          <div className="stat-label">Total Stock Akhir</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(reportSummary?.totalValue || 0)}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reportSummary?.totalMasuk || 0}</div>
          <div className="stat-label">Total Masuk Bulan Ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reportSummary?.totalKeluar || 0}</div>
          <div className="stat-label">Total Keluar Bulan Ini</div>
        </div>
      </div>

      <div className="form-section">
        <h2>Laporan Bulanan</h2>
        <div className="controls-section">
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="reportMonth">Pilih Bulan</label>
              <select id="reportMonth" value={reportMonth} onChange={handleMonthChange}>
                {availableMonths.length > 0 ? (
                  availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))
                ) : (
                  <option value="">Tidak ada laporan tersedia</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="filterMonthlySparepart">Filter Nama Barang</label>
              <input type="text" id="filterMonthlySparepart" placeholder="Cari nama barang..." value={filterSparepart} onChange={handleFilterChange} />
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-info" onClick={exportMonthlyReport}>Export Laporan Bulanan</button>
            <button className="btn btn-warning" onClick={copyToOpname}>Copy ke Stock Opname</button>
            {hasPermission('admin') && (
              <button className="btn btn-danger" onClick={handleDeleteReport}>
                Hapus Laporan
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading">Memuat laporan...</div>
          ) : error ? (
            <div className="error" style={{ color: 'red' }}>Error: {error}</div>
          ) : filteredMonthlyData.length === 0 ? (
            <div className="no-data">Tidak ada data laporan untuk bulan ini.</div>
          ) : (
            <table id="monthlyReportTable">
              <thead>
                <tr>
                  <th className="monthly-col-sku">SKU</th>
                  <th className="monthly-col-nama-barang">Nama Barang</th>
                  <th className="monthly-col-jenis">Jenis</th>
                  <th className="monthly-col-merk">Merk</th>
                  <th className="monthly-col-stock-awal">Stock Awal</th>
                  <th className="monthly-col-harga-awal">Harga Awal</th>
                  <th className="monthly-col-barang-masuk">Barang Masuk</th>
                  <th className="monthly-col-barang-keluar">Barang Keluar</th>
                  <th className="monthly-col-stock-akhir">Stock Akhir</th>
                  <th className="monthly-col-harga-rata-rata">Harga Rata - Rata</th>
                  <th className="monthly-col-total-value">Total Value</th>
                </tr>
              </thead>
              <tbody id="monthlyReportBody">
                {filteredMonthlyData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="monthly-col-sku">{item.itemId?.sku || '-'}</td>
                    <td className="monthly-col-nama-barang">{item.itemId?.name || '-'}</td>
                    <td className="monthly-col-jenis">{item.itemId?.category || '-'}</td>
                    <td className="monthly-col-merk">{item.itemId?.brand || '-'}</td>
                    <td className="monthly-col-stock-awal">{item.stockAwal}</td>
                    <td className="monthly-col-harga-awal">{formatCurrency(item.hargaAwal)}</td>
                    <td className="monthly-col-barang-masuk">{item.barangMasuk}</td>
                    <td className="monthly-col-barang-keluar">{item.barangKeluar}</td>
                    <td className="monthly-col-stock-akhir">{item.stockAkhir}</td>
                    <td className="monthly-col-harga-rata-rata">{formatCurrency(item.hargaRataRata)}</td>
                    <td className="monthly-col-total-value">{formatCurrency(item.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReports;