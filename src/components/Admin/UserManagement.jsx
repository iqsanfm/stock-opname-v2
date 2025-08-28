import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';
import UserFormModal from './UserFormModal';
import './UserManagement.css';

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
    <div className="user-management-container">
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
      
      {isModalOpen && (
        <UserFormModal 
          user={editingUser}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <div className="page-header">
        <h1>User Management</h1>
        <button onClick={handleCreate} className="btn btn-primary">Create New User</button>
      </div>

      {loading && <p>Loading users...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(user)} className="btn btn-sm btn-warning">Edit</button>
                    <button onClick={() => handleDelete(user._id)} className="btn btn-sm btn-danger">Delete</button>
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
