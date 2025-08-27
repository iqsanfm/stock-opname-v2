import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Import Alert component
import './ItemList.css'; // Add this line

const ItemFormModal = ({ show, onClose, item, onSave, handleLogout }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    brand: '',
    unit: '',
    basePrice: '',
  });
  const [alert, setAlert] = useState({ message: '', type: '' });

  useEffect(() => {
    if (item) {
      setFormData({
        sku: item.sku || '',
        name: item.name || '',
        category: item.category || '',
        brand: item.brand || '',
        unit: item.unit || '',
        basePrice: item.basePrice || '',
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        category: '',
        brand: '',
        unit: '',
        basePrice: '',
      });
    }
  }, [item]);

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = item ? 'PUT' : 'POST';
      const endpoint = item ? `/api/items/${item._id}` : '/api/items';
      const response = await apiCall(endpoint, method, formData);

      if (response.success) {
        showAlert(`Item berhasil ${item ? 'diperbarui' : 'ditambahkan'}!`, 'success');
        onSave();
        onClose();
      } else {
        showAlert(response.message || `Gagal ${item ? 'memperbarui' : 'menambahkan'} item.`, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat menyimpan item.', 'error');
      }
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
        <h2>{item ? 'Edit Item' : 'Tambah Item Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sku">SKU</label>
            <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="name">Nama Barang</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="category">Jenis/Kategori</label>
            <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="brand">Merk</label>
            <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="unit">Unit</label>
            <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="basePrice">Harga Dasar</label>
            <input type="number" id="basePrice" name="basePrice" value={formData.basePrice} onChange={handleChange} step="0.01" />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-success">Simpan</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ItemList = ({ user, hasPermission, handleLogout, activeTab }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed items per page
  const [totalItems, setTotalItems] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);

      const response = await apiCall(`/api/items?${params.toString()}`);
      console.log("API Response for /api/items:", response); // Log the response
      if (response.success) {
        setItems(Array.isArray(response.data) ? response.data : []);
        setTotalItems(response.pagination && typeof response.pagination.total === 'number' ? response.pagination.total : 0);
      } else {
        setError('Gagal memuat item: ' + response.message);
      }

      const summaryResponse = await apiCall('/api/items/summary');
      console.log("API Response for /api/items/summary:", summaryResponse); // Log the summary response
      if (summaryResponse.success) {
        setSummaryData(summaryResponse.data || null);
      }

    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setError('Terjadi kesalahan saat memuat item.');
      }
      console.error("Failed to fetch items:", err); // More descriptive log
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filterCategory, handleLogout]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = () => {
    setCurrentItem(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk menghapus item!', 'error');
      return;
    }
    if (window.confirm('Yakin ingin menghapus item ini?')) {
      try {
        const response = await apiCall(`/api/items/${itemId}`, 'DELETE');
        console.log("API Response for DELETE item:", response); // Log delete response
        if (response.success) {
          showAlert('Item berhasil dihapus!', 'success');
          fetchItems(); // Re-fetch items after deletion
        } else {
          showAlert(response.message || 'Gagal menghapus item.', 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat menghapus item.', 'error');
        }
        console.error("Failed to delete item:", err); // Log delete error
      }
    }
  };

  const handleImportCSV = async (event) => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk mengimport CSV!', 'error');
      return;
    }
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showAlert('File harus berformat CSV!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiCall('/api/items/import-csv', 'POST', formData, true); // true for multipart/form-data
      console.log("API Response for import CSV:", response); // Log import response
      if (response.success) {
        showAlert(`Import CSV berhasil! ${response.summary.imported} item diimport, ${response.summary.skipped} dilewati.`, 'success');
        fetchItems(); // Re-fetch items after import
      } else {
        showAlert('Gagal import CSV: ' + response.message, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat import CSV.', 'error');
      }
      console.error("Failed to import CSV:", err); // Log import error
    }
    event.target.value = ''; // Reset input
  };

  const totalPages = Math.ceil((typeof totalItems === 'number' ? totalItems : 0) / itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (num) => {
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const tabClassName = `tab-content ${activeTab === 'items' ? 'active' : ''}`;

  return (
    <div id="itemsTab" className={tabClassName}>
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}

      <h2>Daftar Item Inventaris</h2>

      {/* Summary Statistics */}
      {summaryData && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{summaryData.totalItems}</div>
            <div className="stat-label">Total Item</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(summaryData.totalValue)}</div>
            <div className="stat-label">Total Nilai Inventaris</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summaryData.lowStockItems}</div>
            <div className="stat-label">Item Stok Rendah</div>
          </div>
        </div>
      )}

      <div className="form-section">
        <div className="controls-section">
          <div className="filter-section">
            <div className="form-group">
              <label htmlFor="searchItem">Cari Item</label>
              <input
                type="text"
                id="searchItem"
                placeholder="Cari SKU atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="filterCategory">Filter Kategori</label>
              <input
                type="text"
                id="filterCategory"
                placeholder="Filter berdasarkan kategori..."
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="actions">
            {hasPermission('admin') && (
              <button className="btn btn-success" onClick={handleAddItem}>
                Tambah Item Baru
              </button>
            )}
            {hasPermission('admin') && (
              <button className="btn btn-primary" onClick={() => document.getElementById('importItemCSVFile').click()}>
                Import CSV Item
              </button>
            )}
            <input type="file" id="importItemCSVFile" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
          </div>
        </div>

        <div className="table-container">
          <table id="itemsTable">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Barang</th>
                <th>Jenis</th>
                <th>Merk</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Harga Dasar</th>
                {hasPermission('admin') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={hasPermission('admin') ? "8" : "7"}>Memuat item... (Loading: {loading.toString()})</td></tr>
              ) : error ? (
                <tr><td colSpan={hasPermission('admin') ? "8" : "7"} style={{ color: 'red' }}>Error: {error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={hasPermission('admin') ? "8" : "7"}>Tidak ada item ditemukan. (Items length: {items.length})</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item._id}>
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>{item.category || '-'}</td>
                    <td>{item.brand || '-'}</td>
                    <td>{item.unit}</td>
                    <td>{item.currentStock}</td>
                    <td>{formatCurrency(item.basePrice)}</td>
                    {hasPermission('admin') && (
                      <td>
                        <div className="item-action-buttons"> {/* New wrapper div */}
                          <button className="btn btn-warning btn-sm" onClick={() => handleEditItem(item)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item._id)}>Hapus</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Sebelumnya</button>
          <span>Halaman {currentPage} dari {(totalPages ?? 0).toString()}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Berikutnya</button>
        </div>
      </div>

      <ItemFormModal
        show={showItemModal}
        onClose={() => setShowItemModal(false)}
        item={currentItem}
        onSave={fetchItems}
        handleLogout={handleLogout}
      />
    </div>
  );
};

export default ItemList;