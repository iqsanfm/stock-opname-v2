import React from 'react';
import './UserInfo.css';

const UserInfo = ({ user, onLogout }) => {
  if (!user) {
    return null;
  }

  const roleColor = user.role === 'admin' ? '#e74c3c' : '#3498db';
  const backendMode = user.token ? '🌐 API Mode' : '💾 Offline Mode';
  const backendColor = user.token ? '#27ae60' : '#f39c12';

  return (
    <div className="user-info">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        <strong style={{ fontSize: '1rem' }}>{user.username}</strong>
        <span style={{
          color: roleColor,
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.8rem'
        }}>
          {user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
        </span>
        <span style={{
          color: backendColor,
          fontSize: '0.7rem',
          fontWeight: 500
        }}>
          {backendMode}
        </span>
      </div>
      <button onClick={onLogout} className="logout-btn">
        🚪 Logout
      </button>
    </div>
  );
};

export default UserInfo;
