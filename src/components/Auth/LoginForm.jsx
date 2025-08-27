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
    <div id="loginForm">
      <h2>Login</h2>
      <form id="loginFormElement" onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="loginEmail">Email</label>
          <input 
            type="email" 
            id="loginEmail" 
            required 
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autocomplete="on"
          />
        </div>
        <div className="form-group">
          <label htmlFor="loginPassword">Password</label>
          <input 
            type="password" 
            id="loginPassword" 
            required 
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autocomplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-success">Login</button>
      </form>
      <div className="demo-accounts-info">
        <div className="demo-header">
          <span className="demo-icon">🔑</span>
          <h4>Akun Demo</h4>
        </div>
        <div className="demo-account">
          <div className="demo-role admin">👑 ADMIN</div>
          <div className="demo-credentials">
            <span className="demo-email">admin@inventory.com</span>
            <span className="demo-password">password123</span>
          </div>
        </div>
        <div className="demo-account">
          <div className="demo-role user">👤 USER</div>
          <div className="demo-credentials">
            <span className="demo-email">user1@inventory.com</span>
            <span className="demo-password">password123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;