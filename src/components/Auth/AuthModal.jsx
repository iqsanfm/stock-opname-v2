import { useState } from 'react';
import Alert from '../UI/Alert';
import './AuthModal.css';
import './Login.css';
import LoginForm from './LoginForm';

const AuthPage = ({ onLogin }) => {
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  return (
    <div className="login-page-wrapper">
      <Alert 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert({ message: '', type: '' })} 
      />
      <div id="authModal" className="auth-container">
        <div className="auth-content">
          <LoginForm onLogin={onLogin} showAlert={showAlert} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;