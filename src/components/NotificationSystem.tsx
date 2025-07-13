import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Toast,
  ToastTitle,
  ToastBody,
  ToastFooter,
  Toaster,
  useToastController,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  DismissRegular,
} from '@fluentui/react-icons';
import type { NotificationType, NotificationMessage } from '../types/NotificationTypes';
import { NotificationContext } from '../contexts/NotificationContext';

const useStyles = makeStyles({
  messageBarContainer: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
  },
  toasterContainer: {
    position: 'fixed',
    top: tokens.spacingVerticalXL,
    right: tokens.spacingHorizontalXL,
    zIndex: 1001,
  },
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const styles = useStyles();
  const { dispatchToast } = useToastController('notification-toaster');
  const [messageBar, setMessageBar] = useState<NotificationMessage | null>(null);

  const showToast = useCallback((notification: Omit<NotificationMessage, 'id'>) => {
    const intent = notification.type === 'error' ? 'error' : 
                   notification.type === 'warning' ? 'warning' :
                   notification.type === 'success' ? 'success' : 'info';

    dispatchToast(
      <Toast>
        <ToastTitle
          action={
            <Button
              appearance="transparent"
              icon={<DismissRegular />}
              size="small"
              onClick={() => {/* Toast will auto-dismiss */}}
            />
          }
        >
          {notification.title}
        </ToastTitle>
        <ToastBody>{notification.message}</ToastBody>
        {notification.action && (
          <ToastFooter>
            <Button size="small" onClick={notification.action.onClick}>
              {notification.action.label}
            </Button>
          </ToastFooter>
        )}
      </Toast>,
      { intent, timeout: notification.duration || 4000 }
    );
  }, [dispatchToast]);

  const showMessageBar = useCallback((notification: Omit<NotificationMessage, 'id'>) => {
    const id = `msgbar-${Date.now()}`;
    setMessageBar({ ...notification, id });
  }, []);

  const dismissMessageBar = useCallback(() => {
    setMessageBar(null);
  }, []);

  const getMessageBarIntent = (type: NotificationType) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info':
      default: return 'info';
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, showMessageBar, dismissMessageBar }}>
      {/* Message Bar - sticky at top */}
      {messageBar && (
        <div className={styles.messageBarContainer}>
          <MessageBar intent={getMessageBarIntent(messageBar.type)}>
            <MessageBarBody>
              <MessageBarTitle>{messageBar.title}</MessageBarTitle>
              {messageBar.message}
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <Button
                  appearance="transparent"
                  icon={<DismissRegular />}
                  size="small"
                  onClick={dismissMessageBar}
                />
              }
            >
              {messageBar.action && (
                <Button size="small" onClick={messageBar.action.onClick}>
                  {messageBar.action.label}
                </Button>
              )}
            </MessageBarActions>
          </MessageBar>
        </div>
      )}

      {/* Toast Container */}
      <div className={styles.toasterContainer}>
        <Toaster toasterId="notification-toaster" />
      </div>

      {children}
    </NotificationContext.Provider>
  );
};
