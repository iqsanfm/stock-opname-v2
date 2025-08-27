import { useEffect } from 'react';
import './Alert.css';

const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`alert alert-${type}`}>
      {message}
    </div>
  );
};

export default Alert;
