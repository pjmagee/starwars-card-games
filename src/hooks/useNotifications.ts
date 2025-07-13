import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import type { NotificationContextType } from '../types/NotificationTypes';

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
