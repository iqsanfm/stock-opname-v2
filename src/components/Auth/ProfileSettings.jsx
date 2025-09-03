import React, { useState, useEffect, useCallback } from 'react';
import apiCall from '../../services/api';
import Alert from '../UI/Alert';

const ProfileSettings = ({ user, handleLogout }) => {
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
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center text-gray-600">
          <p>Silakan login untuk melihat pengaturan profil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {alert.message && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-indigo-200 flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-indigo-600">{profile.username.charAt(0).toUpperCase()}</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">{profile.username}</h3>
            <p className="text-gray-500">{profile.email}</p>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-600 py-8">Memuat...</div>
          ) : (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Role:</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${profile.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {profile.role.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={handleLogout}
              className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-md text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
