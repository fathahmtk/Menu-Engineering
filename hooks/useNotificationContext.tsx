import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Notification, NotificationContextType } from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_TIMEOUT = 5000; // 5 seconds

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
};

const SingleNotification: React.FC<{ notification: Notification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(notification.id), 300); // Allow time for exit animation
    }, NOTIFICATION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };
  
  const animationClass = isExiting ? 'animate-fadeOut' : 'animate-fadeInRight';

  return (
    <div
      style={{
        animation: `${isExiting ? 'slideOutRight 0.3s ease-out forwards' : 'slideInRight 0.3s ease-out forwards'}`
      }}
      className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg flex items-center p-4 w-full max-w-sm"
    >
      <div className="flex-shrink-0">{icons[notification.type]}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{notification.message}</p>
      </div>
      <button onClick={handleDismiss} className="ml-4 p-1 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-input)]">
        <X size={16} />
      </button>
    </div>
  );
};


export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      type,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {notifications.map(n => (
          <SingleNotification key={n.id} notification={n} onDismiss={removeNotification} />
        ))}
      </div>
       <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
