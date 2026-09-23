import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let icon = <Info size={16} color="#60a5fa" />;
        let borderColor = '#3b82f6';

        if (toast.type === 'success') {
          icon = <CheckCircle2 size={16} color="#34d399" />;
          borderColor = '#10b981';
        } else if (toast.type === 'danger' || toast.type === 'warn') {
          icon = <AlertCircle size={16} color="#f87171" />;
          borderColor = '#ef4444';
        }

        return (
          <div
            key={toast.id}
            className="toast-item"
            style={{ borderLeft: `4px solid ${borderColor}` }}
          >
            <div className="toast-icon">{icon}</div>
            <div className="toast-message">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
