import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';
import RecipeFormModal from './RecipeFormModal';
import './RecipeManagement.css';

const RecipeManagement = ({ user, hasPermission, handleLogout, activeTab }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/recipes');
      if (response.success) {
        setRecipes(response.data || []);
      } else {
        setError('Gagal memuat resep: ' + response.message);
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setError('Terjadi kesalahan saat memuat resep.');
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (activeTab === 'recipes') {
      fetchRecipes();
    }
  }, [activeTab, fetchRecipes]);

  const handleAddRecipe = () => {
    setCurrentItem(null);
    setShowModal(true);
  };

  const handleEditRecipe = (recipe) => {
    setCurrentItem(recipe);
    setShowModal(true);
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!hasPermission('admin')) {
      showAlert('Anda tidak memiliki izin untuk menghapus resep.', 'error');
      return;
    }
    if (window.confirm('Yakin ingin menghapus resep ini?')) {
      try {
        const response = await apiCall(`/api/recipes/${recipeId}`, 'DELETE');
        if (response.success) {
          showAlert('Resep berhasil dihapus.', 'success');
          fetchRecipes();
        } else {
          showAlert(response.message || 'Gagal menghapus resep.', 'error');
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(err.message || 'Terjadi kesalahan saat menghapus resep.', 'error');
        }
      }
    }
  };

  const tabClassName = `tab-content ${activeTab === 'recipes' ? 'active' : ''}`;

  return (
    <div id="recipesTab" className={tabClassName}>
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
      
      <h2>Manajemen Resep</h2>

      <div className="form-section">
        <div className="actions">
          {hasPermission('admin') && (
            <button className="btn btn-success" onClick={handleAddRecipe}>
              Tambah Resep Baru
            </button>
          )}
        </div>

        <div className="table-container">
          <table id="recipesTable">
            <thead>
              <tr>
                <th>Produk Jadi</th>
                <th>Bahan Baku</th>
                {hasPermission('admin') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={hasPermission('admin') ? "3" : "2"}>Memuat resep...</td></tr>
              ) : error ? (
                <tr><td colSpan={hasPermission('admin') ? "3" : "2"} style={{ color: 'red' }}>Error: {error}</td></tr>
              ) : recipes.length === 0 ? (
                <tr><td colSpan={hasPermission('admin') ? "3" : "2"}>Belum ada resep yang dibuat.</td></tr>
              ) : (
                recipes.map(recipe => (
                  <tr key={recipe._id}>
                    <td>{recipe.product?.name || 'Produk tidak ditemukan'}</td>
                    <td>
                      <ul>
                        {recipe.ingredients.map(ing => (
                          <li key={ing._id}>
                            {ing.item?.name || 'Item tidak ditemukan'}: {ing.quantity} {ing.item?.consumptionUnit || ''}
                          </li>
                        ))}
                      </ul>
                    </td>
                    {hasPermission('admin') && (
                      <td className="recipe-actions">
                        <button className="btn btn-warning btn-sm" onClick={() => handleEditRecipe(recipe)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRecipe(recipe._id)}>Hapus</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecipeFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        recipe={currentItem}
        onSave={fetchRecipes}
        handleLogout={handleLogout}
      />
    </div>
  );
};

export default RecipeManagement;
