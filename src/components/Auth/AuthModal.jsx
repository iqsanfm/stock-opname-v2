import { useState } from 'react';
import Alert from '../UI/Alert';
// apiCall is now used only in LoginForm and RegisterForm, so it can be removed from here
// import apiCall from '../../services/api';
import './AuthModal.css'; // Import the dedicated CSS file
import './Login.css'; // ADD THIS LINE
import LoginForm from './LoginForm'; // Import LoginForm
import RegisterForm from './RegisterForm'; // Import RegisterForm

const AuthPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  // Form state (removed as it's now in LoginForm/RegisterForm)
  // const [loginEmail, setLoginEmail] = useState('admin@inventory.com');
  // const [loginPassword, setLoginPassword] = useState('password123');
  // const [registerUsername, setRegisterUsername] = useState('');
  // const [registerEmail, setRegisterEmail] = useState('');
  // const [registerPassword, setRegisterPassword] = useState('');
  // const [registerRole, setRegisterRole] = useState('user');

  // Alert state
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  // Handlers (removed as they are now in LoginForm/RegisterForm)
  // const handleLogin = async (e) => { ... };
  // const handleRegister = async (e) => { ... };

  return (
    <div className="login-page-wrapper">
      <Alert 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert({ message: '', type: '' })} 
      />
      <div id="authModal" className="auth-container">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>
        <div className="auth-content">
          {activeTab === 'login' ? (
            <LoginForm onLogin={onLogin} showAlert={showAlert} /> // Render LoginForm
          ) : (
            <RegisterForm onLogin={onLogin} showAlert={showAlert} /> // Render RegisterForm
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;