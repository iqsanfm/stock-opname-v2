import React, { useState } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Assuming Alert is used within LoginForm


const LoginForm = ({ onLogin, showAlert }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await apiCall('/api/auth/login', 'POST', { email: loginEmail, password: loginPassword });

      if (response.success && response.token) {
        const userData = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
          token: response.token,
        };
        showAlert('Login berhasil!', 'success');
        onLogin(userData);
      } else {
        throw new Error(response.message || 'Login Gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to localStorage (for demo/offline mode)
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const user = users.find(u => u.email === loginEmail && u.password === loginPassword);

      if (user) {
        const userData = {
          username: user.username,
          email: user.email,
          role: user.role,
          token: null, // No token for local auth
        };
        showAlert('Login berhasil! (Mode Offline)', 'info');
        onLogin(userData);
      } else {
        showAlert(error.message === 'CORS_ERROR' ? 'CORS issue, using offline mode' : 'Email atau password salah!', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-gray-900">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="loginEmail"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autoComplete="on"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="loginPassword"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autoComplete="new-password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Login
        </button>
      </form>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Akun Demo</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <span className="text-xl">👑</span>
            <div>
              <div className="font-medium text-gray-900">ADMIN</div>
              <div className="text-sm text-gray-600">admin@inventory.com</div>
              <div className="text-sm text-gray-600">password123</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <span className="text-xl">👤</span>
            <div>
              <div className="font-medium text-gray-900">USER</div>
              <div className="text-sm text-gray-600">user1@inventory.com</div>
              <div className="text-sm text-gray-600">password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;