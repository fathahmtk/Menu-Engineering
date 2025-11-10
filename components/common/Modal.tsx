
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-white/40">
        <div className="flex justify-between items-center p-4 border-b border-black/10">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;