export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // For toasts
  persistent?: boolean; // For message bars
}

export interface NotificationContextType {
  showToast: (notification: Omit<NotificationMessage, 'id'>) => void;
  showMessageBar: (notification: Omit<NotificationMessage, 'id'>) => void;
  dismissMessageBar: () => void;
}
