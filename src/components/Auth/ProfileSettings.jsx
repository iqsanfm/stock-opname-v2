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

  if (!user) {
    return <div className="profile-settings-container">Silakan login untuk melihat pengaturan profil.</div>;
  }

  return (
    <div className="profile-settings-container">
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}
      
      <h2>Pengaturan Profil</h2>
      <div className="user-profile-info-section form-section">
        <h3>Informasi Pengguna</h3>
        {isLoading ? (
          <div className="loading-indicator">Memuat...</div>
        ) : (
          <>
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Role:</strong> <span style={{ color: profile.role === 'admin' ? '#e74c3c' : '#3498db', fontWeight: 600 }}>{profile.role.toUpperCase()}</span></p>
          </>
        )}
        <button onClick={handleLogout} className="profile-btn btn-danger" style={{ marginTop: '15px' }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
