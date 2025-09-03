import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';
import UserFormModal from './UserFormModal';


const UserManagement = ({ handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/auth/users');
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.message || 'Failed to fetch users.');
        showAlert(response.message || 'Failed to fetch users.', 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setError(err.message || 'An error occurred while fetching users.');
        showAlert(err.message || 'An error occurred while fetching users.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout, showAlert]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      let response;
      const payload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        // Edit user
        response = await apiCall(`/api/auth/users/${editingUser._id}`, 'PUT', payload);
      } else {
        // Create user
        response = await apiCall('/api/auth/users', 'POST', payload);
      }

      if (response.success) {
        showAlert(`User successfully ${editingUser ? 'updated' : 'created'}!`, 'success');
        setIsModalOpen(false);
        fetchUsers(); // Refresh the user list
      } else {
        showAlert(response.message || 'Failed to save user.', 'error');
      }
    } catch (err) {
      showAlert(err.message || 'An error occurred while saving the user.', 'error');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await apiCall(`/api/auth/users/${userId}`, 'DELETE');
        if (response.success) {
          showAlert('User successfully deleted!', 'success');
          fetchUsers(); // Refresh the user list
        } else {
          showAlert(response.message || 'Failed to delete user.', 'error');
        }
      } catch (err) {
        showAlert(err.message || 'An error occurred while deleting the user.', 'error');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
      
      {isModalOpen && (
        <UserFormModal 
          user={editingUser}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-start sm:justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <button 
          onClick={handleCreate} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
        >
          Create New User
        </button>
      </div>

      {loading && <p className="text-center text-gray-600">Loading users...</p>}
      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
      
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(user)} 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(user._id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
