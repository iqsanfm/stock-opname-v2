import { useState } from 'react';
import Alert from '../UI/Alert';

import LoginForm from './LoginForm';

const AuthPage = ({ onLogin }) => {
  const [alert, setAlert] = useState({ message: '', type: '' });

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: '', type: '' })}
      />
      <div id="authModal" className="bg-white p-10 rounded-xl shadow-2xl max-w-[800px] w-full transform transition-all duration-300 hover:shadow-3xl border border-gray-200">
        <div className="text-center">
          <LoginForm onLogin={onLogin} showAlert={showAlert} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;