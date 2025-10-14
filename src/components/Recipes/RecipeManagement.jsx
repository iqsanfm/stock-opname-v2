import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';
import RecipeFormModal from './RecipeFormModal';

const RecipeManagement = ({ hasPermission, handleLogout, activeTab }) => {
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
      const response = await apiCall('api/recipes');
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
        const response = await apiCall(`api/recipes/${recipeId}`, 'DELETE');
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

  const tabDisplayClass = activeTab === 'recipes' ? 'block' : 'hidden';

  return (
    <div id="recipesTab" className={`p-4 ${tabDisplayClass}`}>
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Resep</h2>
        {hasPermission('admin') && (
          <button
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleAddRecipe}
          >
            Tambah Resep Baru
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Produk Jadi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Bahan Baku</th>
              {hasPermission('admin') && <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={hasPermission('admin') ? "3" : "2"} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Memuat resep...</td></tr>
            ) : error ? (
              <tr><td colSpan={hasPermission('admin') ? "3" : "2"} className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">Error: {error}</td></tr>
            ) : recipes.length === 0 ? (
              <tr><td colSpan={hasPermission('admin') ? "3" : "2"} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">Belum ada resep yang dibuat.</td></tr>
            ) : (
              recipes.map(recipe => (
                <tr key={recipe._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recipe.product?.name || 'Produk tidak ditemukan'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <ul className="list-disc list-inside space-y-1">
                      {recipe.ingredients.map(ing => (
                        <li key={ing._id}>
                          {ing.item?.name || 'Item tidak ditemukan'}: {ing.quantity} {ing.item?.consumptionUnit || ''}
                        </li>
                      ))}
                    </ul>
                  </td>
                  {hasPermission('admin') && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={() => handleEditRecipe(recipe)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteRecipe(recipe._id)}
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
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
