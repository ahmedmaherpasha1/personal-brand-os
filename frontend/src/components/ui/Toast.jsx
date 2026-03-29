import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ICONS = {
  success: 'check_circle',
  error: 'cancel',
  info: 'info',
};

const ICON_COLORS = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

const ToastContext = createContext(null);

function ToastMessage({ toast, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 200);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`bg-surface-container-lowest shadow-ambient rounded-xl p-4 flex items-center gap-3 min-w-[280px] max-w-sm transition-all duration-200 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span className={`material-symbols-outlined ${ICON_COLORS[toast.type]} text-[22px]`}>
        {ICONS[toast.type]}
      </span>
      <p className="text-on-surface text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
