import React, { useState, useEffect } from 'react';


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
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-auto transform transition-all sm:my-8 sm:align-middle">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEditMode ? 'Edit User' : 'Create New User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <hr className="my-4 border-gray-200" />

          {isEditMode ? (
            <p className="text-sm text-gray-600">Leave password fields blank to keep the current password.</p>
          ) : null}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{isEditMode ? 'New Password' : 'Password'}</label>
            <input
              type="password"
              id="password"
              name="password"
              required={!isEditMode} // Only required for new users
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm {isEditMode ? 'New' : ''} Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required={!isEditMode || !!formData.password} // Required if creating or if new password is set
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditMode ? 'Save Changes' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
