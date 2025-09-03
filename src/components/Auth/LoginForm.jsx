import React, { useState } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Assuming Alert is used within LoginForm


const LoginForm = ({ onLogin, showAlert }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Login</h2>
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="loginEmail"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autoComplete="on"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
        <div className="relative"> {/* Added relative positioning */}
          <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type={showPassword ? "text" : "password"} // Conditional type
            id="loginPassword"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autoComplete="new-password"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out pr-10" // Added pr-10 for icon space
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-6" // Positioned icon
          >
            {showPassword ? (
              // Eye-slash icon (hide password)
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.418 0-8.284-2.134-11-5.5.94-1.265 2.21-2.34 3.68-3.18M21 12c-1.764 2.77-4.503 4.92-7.5 5.5m-3.5-3.5a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              // Eye icon (show password)
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          Login
        </button>
      </form>
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Akun Demo</h4>
        <div className="space-y-4 flex flex-col items-center">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg shadow-sm">
            <span className="text-2xl">👑</span>
            <div>
              <div className="font-medium text-gray-900">ADMIN</div>
              <div className="text-sm text-gray-600">admin@inventory.com</div>
              <div className="text-sm text-gray-600">password123</div>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg shadow-sm">
            <span className="text-2xl">👤</span>
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