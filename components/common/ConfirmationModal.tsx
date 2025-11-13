
import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'ican-btn ican-btn-danger',
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 md:mx-0 md:h-10 md:w-10">
          <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center md:mt-0 md:ml-4 md:text-left">
          <div className="mt-2">
            <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 md:mt-4 md:flex md:flex-row-reverse">
        <button
          type="button"
          className={confirmButtonClass}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmText}
        </button>
        {cancelText && <button
          type="button"
          className="ican-btn ican-btn-secondary mt-3 w-full md:mt-0 md:w-auto"
          onClick={onClose}
        >
          {cancelText}
        </button>}
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
