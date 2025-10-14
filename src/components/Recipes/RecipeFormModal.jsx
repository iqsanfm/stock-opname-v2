import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';

const RecipeFormModal = ({ show, onClose, recipe, onSave, handleLogout }) => {
  const [productId, setProductId] = useState('');
  const [ingredients, setIngredients] = useState([{ item: '', quantity: '' }]);
  const [allItems, setAllItems] = useState([]);
  const [alert, setAlert] = useState({ message: '', type: '' });

  // Fetch all items to be used in dropdowns
  const fetchAllItems = useCallback(async () => {
    try {
      // Assuming an endpoint that returns all items without pagination
      const response = await apiCall('api/items?limit=0'); 
      if (response.success && Array.isArray(response.data)) {
        setAllItems(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch items for form", err);
    }
  }, []);

  useEffect(() => {
    if (show) {
      fetchAllItems();
    }
  }, [show, fetchAllItems]);

  useEffect(() => {
    if (recipe) {
      setProductId(recipe.product?._id || '');
      setIngredients(recipe.ingredients.map(ing => ({
        item: ing.item?._id || '',
        quantity: ing.quantity || ''
      })) || [{ item: '', quantity: '' }]);
    } else {
      setProductId('');
      setIngredients([{ item: '', quantity: '' }]);
    }
  }, [recipe]);

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 3000);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { item: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || ingredients.some(ing => !ing.item || !ing.quantity)) {
      showAlert('Harap isi semua field yang diperlukan.', 'error');
      return;
    }

    const payload = {
      productId,
      ingredients: ingredients.map(ing => ({
        item: ing.item,
        quantity: parseFloat(ing.quantity)
      })),
    };

    try {
      const method = recipe ? 'PUT' : 'POST';
      const endpoint = recipe ? `api/recipes/${recipe._id}` : 'api/recipes';
      const response = await apiCall(endpoint, method, payload);

      if (response.success) {
        showAlert(`Resep berhasil ${recipe ? 'diperbarui' : 'dibuat'}!`, 'success');
        onSave();
        onClose();
      } else {
        showAlert(response.message || `Gagal menyimpan resep.`, 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else if (err.statusCode === 400 && err.body && err.body.message) {
        showAlert(err.body.message, 'error');
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat menyimpan resep.', 'error');
      }
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl relative max-w-3xl w-full mx-auto transform transition-all sm:my-8 sm:align-middle">
        {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{recipe ? 'Edit Resep' : 'Buat Resep Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700">Produk Jadi</label>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Pilih Produk Jadi</option>
              {allItems.map(item => (
                <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
              ))}
            </select>
          </div>

          <hr className="my-4 border-gray-200" />
          <h4 className="text-lg font-semibold mb-3 text-gray-800">Bahan Baku</h4>
          {ingredients.length === 0 && <p className="text-gray-600 mb-4">Belum ada bahan baku ditambahkan. Klik "+ Tambah Bahan" untuk memulai.</p>}
          {ingredients.map((ing, index) => {
            const selectedItem = allItems.find(item => item._id === ing.item);
            return (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end mb-4" key={index}>
                <div>
                  <label htmlFor={`ingredient-item-${index}`} className="block text-sm font-medium text-gray-700">Item Bahan</label>
                  <select
                    id={`ingredient-item-${index}`}
                    value={ing.item}
                    onChange={(e) => handleIngredientChange(index, 'item', e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="" disabled>Pilih Bahan</option>
                    {allItems.map(item => (
                      <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <label htmlFor={`ingredient-quantity-${index}`} className="block text-sm font-medium text-gray-700">Jumlah</label>
                    <input
                      type="number"
                      id={`ingredient-quantity-${index}`}
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      placeholder="Jumlah"
                      step="0.01"
                      min="0"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  {selectedItem && selectedItem.consumptionUnit && (
                    <span className="text-gray-600 text-sm whitespace-nowrap mb-1">({selectedItem.consumptionUnit})</span>
                  )}
                </div>
                <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-auto" onClick={() => removeIngredient(index)}>Hapus</button>
              </div>
            );
          })}
          <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onClick={addIngredient}>+ Tambah Bahan</button>

          <div className="flex justify-end space-x-3 mt-6">
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Simpan Resep</button>
            <button type="button" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeFormModal;