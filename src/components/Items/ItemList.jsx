import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Import Alert component

const ItemFormModal = ({ show, onClose, item, onSave, handleLogout }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    brand: '',
    unit: '',
    basePrice: '',
    stockUnit: '',
    consumptionUnit: '',
    conversionFactor: 1,
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
        stockUnit: item.stockUnit || '',
        consumptionUnit: item.consumptionUnit || '',
        conversionFactor: item.conversionFactor || 1,
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        category: '',
        brand: '',
        unit: '',
        basePrice: '',
        stockUnit: '',
        consumptionUnit: '',
        conversionFactor: 1,
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
        return; // Stop execution after logout
      }

      // Check for specific backend error response
      if (err.statusCode === 400 && err.body && err.body.message) {
        showAlert(err.body.message, 'error');
      } else {
        // Fallback for other errors
        showAlert(err.message || 'Terjadi kesalahan saat menyimpan item.', 'error');
      }
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl relative max-w-lg w-full mx-auto transform transition-all sm:my-8 sm:align-middle">
        {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{item ? 'Edit Item' : 'Tambah Item Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
            <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Barang</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Jenis/Kategori</label>
            <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Merk</label>
            <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit Jual</label>
            <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., porsi, gelas, pcs" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <hr className="my-4 border-gray-200" />
          <p className="text-sm text-gray-600 mb-4">Isi bagian di bawah ini jika item ini adalah bahan baku atau memiliki konversi unit.</p>
          <div>
            <label htmlFor="stockUnit" className="block text-sm font-medium text-gray-700">Unit Stok</label>
            <input type="text" id="stockUnit" name="stockUnit" value={formData.stockUnit} onChange={handleChange} placeholder="e.g., kg, liter, box" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="consumptionUnit" className="block text-sm font-medium text-gray-700">Unit Konsumsi</label>
            <input type="text" id="consumptionUnit" name="consumptionUnit" value={formData.consumptionUnit} onChange={handleChange} placeholder="e.g., gram, ml, pcs" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="conversionFactor" className="block text-sm font-medium text-gray-700">Faktor Konversi</label>
            <input type="number" id="conversionFactor" name="conversionFactor" value={formData.conversionFactor} onChange={handleChange} step="0.001" min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <hr className="my-4 border-gray-200" />
          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">Harga Dasar</label>
            <input type="number" id="basePrice" name="basePrice" value={formData.basePrice} onChange={handleChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Simpan</button>
            <button type="button" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ItemList = ({ hasPermission, handleLogout, activeTab, items, loading, error, pagination, onPageChange, triggerItemsRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summaryResponse = await apiCall('/api/items/summary');
        if (summaryResponse.success) {
          setSummaryData(summaryResponse.data || null);
        }
      } catch (err) {
        console.error("Failed to fetch summary data:", err);
      }
    };
    if (activeTab === 'items') {
      fetchSummary();
    }
  }, [activeTab, items]);

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
        if (response.success) {
          showAlert('Item berhasil dihapus!', 'success');
          triggerItemsRefresh();
        } else {
          showAlert(response.message || 'Gagal menghapus item.', 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat menghapus item.', 'error');
        }
        console.error("Failed to delete item:", err);
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
      const response = await apiCall('/api/items/import-csv', 'POST', formData, true);
      if (response.success) {
        showAlert(`Import CSV berhasil! ${response.summary.imported} item diimport, ${response.summary.skipped} dilewati.`, 'success');
        triggerItemsRefresh();
      } else {
        showAlert('Gagal import CSV: ' + response.message, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat import CSV.', 'error');
      }
      console.error("Failed to import CSV:", err);
    }
    event.target.value = ''; // Reset input
  };

  const formatCurrency = (num) => {
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const totalPages = Math.ceil((pagination.totalItems || 0) / pagination.itemsPerPage);

  const filteredItems = items.filter(item => {
    const searchTermMatch = searchTerm === '' || 
                            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = filterCategory === '' || item.category.toLowerCase().includes(filterCategory.toLowerCase());
    return searchTermMatch && categoryMatch;
  });

  const tabDisplayClass = activeTab === 'items' ? 'block' : 'hidden';

  return (
    <div id="itemsTab" className={`p-4 ${tabDisplayClass}`}>
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}

      {/* Summary Statistics */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
            <div className="text-3xl font-bold">{summaryData.totalItems}</div>
            <div className="text-sm">Total Item</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
            <div className="text-3xl font-bold">{formatCurrency(summaryData.totalValue)}</div>
            <div className="text-sm">Total Nilai Inventaris</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
            <div className="text-3xl font-bold">{summaryData.lowStockItems}</div>
            <div className="text-sm">Item Stok Rendah</div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <div className="flex flex-wrap justify-between items-start mb-6 gap-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="mb-4">
              <label htmlFor="searchItem" className="block text-gray-700 text-sm font-bold mb-2">Cari Item</label>
              <input
                type="text"
                id="searchItem"
                placeholder="Cari SKU atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="filterCategory" className="block text-gray-700 text-sm font-bold mb-2">Filter Kategori</label>
              <input
                type="text"
                id="filterCategory"
                placeholder="Filter berdasarkan kategori..."
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            {hasPermission('admin') && (
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={handleAddItem}>
                Tambah Item Baru
              </button>
            )}
            {hasPermission('admin') && (
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium mt-7" onClick={() => document.getElementById('importItemCSVFile').click()}>
                Import CSV Item
              </button>
            )}
            <input type="file" id="importItemCSVFile" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
          </div>
        </div>
      </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
          <div className="w-full">
            <table id="itemsTable" className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-64">Nama Barang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-24">Merk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-24">Unit Jual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">Unit Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">Unit Konsumsi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Faktor Konversi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-24">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-36">Harga Dasar</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-36">Harga Rata-rata</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-48">Nilai Total Stok</th>
                  {hasPermission('admin') && <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-36">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={hasPermission('admin') ? "13" : "12"} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Memuat item...</td></tr>
                ) : error ? (
                  <tr><td colSpan={hasPermission('admin') ? "13" : "12"} className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">Error: {error}</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={hasPermission('admin') ? "13" : "12"} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Tidak ada item ditemukan.</td></tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-32 overflow-hidden text-ellipsis">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-64 overflow-hidden text-ellipsis">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-40 overflow-hidden text-ellipsis">{item.category || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-24 overflow-hidden text-ellipsis">{item.brand || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-24 overflow-hidden text-ellipsis">{item.unit || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-28 overflow-hidden text-ellipsis">{item.stockUnit || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-28 overflow-hidden text-ellipsis">{item.consumptionUnit || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-32 overflow-hidden text-ellipsis">{item.conversionFactor || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-24 overflow-hidden text-ellipsis">{item.currentStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-36 text-right overflow-hidden text-ellipsis">{formatCurrency(item.basePrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-36 text-right overflow-hidden text-ellipsis">{formatCurrency(item.averagePrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-48 text-right overflow-hidden text-ellipsis">{formatCurrency(item.totalValue)}</td>
                      {hasPermission('admin') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-36 overflow-hidden text-ellipsis">
                          <div className="flex gap-2 justify-center items-center">
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium" onClick={() => handleEditItem(item)}>Edit</button>
                            <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium" onClick={() => handleDeleteItem(item._id)}>Hapus</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

                {/* Pagination */}
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors duration-200
                ${pagination.currentPage === page
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Berikutnya
          </button>
        </div>

        <ItemFormModal
          show={showItemModal}
          onClose={() => setShowItemModal(false)}
          item={currentItem}
          onSave={triggerItemsRefresh}
          handleLogout={handleLogout}
        />
    </div>
  );
};

export default ItemList;
