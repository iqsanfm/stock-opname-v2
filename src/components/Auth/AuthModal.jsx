import { useState } from 'react';
import Alert from '../UI/Alert';

import LoginForm from './LoginForm';

const AuthPage = ({ onLogin }) => {
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: '', type: '' })}
      />
      <div id="authModal" className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-auto transform transition-all sm:my-8 sm:align-middle">
        <div className="text-center">
          <LoginForm onLogin={onLogin} showAlert={showAlert} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;