import React, { useState } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert'; // Assuming Alert is used within RegisterForm

const RegisterForm = ({ onLogin, showAlert }) => {
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('user');

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await apiCall('/api/auth/register', 'POST', {
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
        role: registerRole,
      });

      if (response.success && response.token) {
        const userData = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
          token: response.token,
        };
        showAlert('Registrasi berhasil!', 'success');
        onLogin(userData); // Auto-login after successful registration
      } else {
        throw new Error(response.message || 'Registrasi Gagal');
      }
    } catch (error) {
      console.error('Registrasi error:', error);
      showAlert(error.message || 'Terjadi kesalahan saat registrasi.', 'error');
    }
  };

  return (
    <div id="registerForm">
      <h2>Register</h2>
      <form id="registerFormElement" onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="registerUsername">Username</label>
          <input 
            type="text" 
            id="registerUsername" 
            required 
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="registerEmail">Email</label>
          <input 
            type="email" 
            id="registerEmail" 
            required 
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="registerPassword">Password</label>
          <input 
            type="password" 
            id="registerPassword" 
            required 
            minLength="6" 
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="registerRole">Role</label>
          <select 
            id="registerRole" 
            value={registerRole}
            onChange={(e) => setRegisterRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success">Register</button>
      </form>
    </div>
  );
};

export default RegisterForm;