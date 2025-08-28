import React, { useState, useEffect } from 'react';
import './UserFormModal.css';

const UserFormModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const isEditMode = !!user;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
    setConfirmPassword('');
  }, [user, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== confirmPassword) {
      // A bit of a hack: use window.alert because the Alert component is in the parent
      window.alert('Password confirmation does not match!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{isEditMode ? 'Edit User' : 'Create New User'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <hr />

          {isEditMode ? (
            <p>Leave password fields blank to keep the current password.</p>
          ) : null}

          <div className="form-group">
            <label htmlFor="password">{isEditMode ? 'New Password' : 'Password'}</label>
            <input
              type="password"
              id="password"
              name="password"
              required={!isEditMode} // Only required for new users
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm {isEditMode ? 'New' : ''} Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required={!isEditMode || !!formData.password} // Required if creating or if new password is set
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">{isEditMode ? 'Save Changes' : 'Create User'}</button>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
