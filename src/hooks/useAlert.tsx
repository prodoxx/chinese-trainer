'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AlertDialog, { AlertType } from '@/components/AlertDialog';

interface AlertOptions {
  title?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => void;
  showConfirm: (message: string, options?: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    message: string;
    title?: string;
    type: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onClose?: () => void;
  }>({
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((message: string, options?: AlertOptions) => {
    setAlertConfig({
      message,
      title: options?.title,
      type: options?.type || 'info',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((message: string, options?: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertConfig({
        message,
        title: options?.title,
        type: 'confirm',
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        onConfirm: () => resolve(true),
        onClose: () => resolve(false),
      });
      setIsOpen(true);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (alertConfig.onClose) {
      alertConfig.onClose();
    }
  };

  const handleConfirm = () => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={alertConfig.type === 'confirm' ? handleConfirm : undefined}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}