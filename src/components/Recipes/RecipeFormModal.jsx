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
      const response = await apiCall('/api/items?limit=0'); 
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
      const endpoint = recipe ? `/api/recipes/${recipe._id}` : '/api/recipes';
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
    <div className="modal-overlay">
      <div className="modal-content large">
        {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
        <h2>{recipe ? 'Edit Resep' : 'Buat Resep Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="product">Produk Jadi</label>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Produk Jadi</option>
              {allItems.map(item => (
                <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
              ))}
            </select>
          </div>

          <hr />
          <h4>Bahan Baku</h4>
          {ingredients.length === 0 && <p>Belum ada bahan baku ditambahkan. Klik "+ Tambah Bahan" untuk memulai.</p>}
          {ingredients.map((ing, index) => {
            const selectedItem = allItems.find(item => item._id === ing.item);
            return (
              <div className="ingredient-row" key={index}>
                <div className="form-group">
                  <label htmlFor={`ingredient-item-${index}`}>Item Bahan</label>
                  <select
                    id={`ingredient-item-${index}`}
                    value={ing.item}
                    onChange={(e) => handleIngredientChange(index, 'item', e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih Bahan</option>
                    {allItems.map(item => (
                      <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group quantity-group">
                  <label htmlFor={`ingredient-quantity-${index}`}>Jumlah</label>
                  <div className="quantity-input-wrapper">
                    <input
                      type="number"
                      id={`ingredient-quantity-${index}`}
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      placeholder="Jumlah"
                      step="0.01"
                      min="0"
                      required
                    />
                    {selectedItem && selectedItem.consumptionUnit && (
                      <span className="unit-display">{selectedItem.consumptionUnit}</span>
                    )}
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeIngredient(index)}>Hapus</button>
                </div>
              </div>
            );
          })}
          <button type="button" className="btn btn-secondary" onClick={addIngredient}>+ Tambah Bahan</button>

          <div className="modal-actions">
            <button type="submit" className="btn btn-success">Simpan Resep</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeFormModal;
