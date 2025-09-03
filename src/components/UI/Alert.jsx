import { useEffect } from 'react';


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
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-md shadow-lg text-white z-[1000] min-w-[300px] text-center
      ${type === 'success' ? 'bg-green-500' : ''}
      ${type === 'error' ? 'bg-red-500' : ''}
      ${type === 'info' ? 'bg-blue-500' : ''}
      ${type === 'warning' ? 'bg-yellow-500' : ''}
    `}>
      {message}
    </div>
  );
};

export default Alert;
