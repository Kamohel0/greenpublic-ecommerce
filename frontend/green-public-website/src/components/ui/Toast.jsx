import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', visible = false, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  if (!visible || !message) return null;

  const base = 'fixed right-4 top-6 z-[9999] max-w-sm rounded-lg shadow-lg px-4 py-3 flex items-start gap-3';
  const colors = {
    info: 'bg-white border border-gray-200 text-gray-800',
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
  };

  return (
    <div className={`${base} ${colors[type] || colors.info}`} role="status" aria-live="polite">
      <div className="flex-1">
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={() => onClose && onClose()}
        aria-label="Close notification"
        className="text-gray-500 hover:text-gray-700 ml-2"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
