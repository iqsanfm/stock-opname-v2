import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';
import './ProfileSettings.css';

const ProfileSettings = ({ user, handleLogout, hasPermission }) => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    role: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  }, []);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/api/auth/profile', 'GET');
      if (response.success && response.user) {
        setProfile({
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
        });
      } else {
        showAlert(response.message || 'Gagal memuat profil.', 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat memuat profil.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout, showAlert]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiCall('/api/auth/profile', 'PUT', {
        username: profile.username,
        email: profile.email,
      });
      if (response.success) {
        showAlert('Profil berhasil diperbarui!', 'success');
        // Optionally update user in App.jsx state if needed
      } else {
        showAlert(response.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat memperbarui profil.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showAlert('Konfirmasi password tidak cocok!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Password baru minimal 6 karakter!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall('/api/auth/change-password', 'PUT', {
        newPassword: newPassword,
      });
      if (response.success) {
        showAlert('Password berhasil diubah!', 'success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showAlert(response.message || 'Gagal mengubah password.', 'error');
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        showAlert(err.message || 'Terjadi kesalahan saat mengubah password.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="profile-settings-container">Silakan login untuk melihat pengaturan profil.</div>;
  }

  return (
    <div className="profile-settings-container">
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
      
      <h2>Pengaturan Profil</h2>
      {isLoading && <div className="loading-indicator">Memuat...</div>}

      <div className="form-section">
        <h3>Informasi Dasar</h3>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              required
              disabled // Email usually not editable
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={profile.role.toUpperCase()}
              disabled
            />
          </div>
          <button type="submit" className="profile-btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Memperbarui...' : 'Perbarui Profil'}
          </button>
        </form>
      </div>

      <div className="form-section">
        <h3>Ubah Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="newPassword">Password Baru</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          <button type="submit" className="profile-btn btn-warning" disabled={isLoading}>
            {isLoading ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
