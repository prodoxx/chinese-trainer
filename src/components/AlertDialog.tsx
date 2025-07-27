'use client';

import { useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

export default function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the dialog for accessibility
      dialogRef.current?.focus();
      
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-violet-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'confirm':
        return 'Confirm Action';
      default:
        return 'Information';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4">
          {getIcon()}
          <h2 className="text-lg font-semibold text-white flex-1">
            {title || getDefaultTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-300 whitespace-pre-wrap">{message}</p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all duration-200 font-medium text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}