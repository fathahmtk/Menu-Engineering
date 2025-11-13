
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Modal from '../components/common/Modal';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesContextType {
  setIsDirty: (isDirty: boolean, saveAction?: () => Promise<void>) => void;
  promptNavigation: (onConfirm: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

const UnsavedChangesModal: React.FC<{
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}> = ({ isOpen, onSave, onDiscard, onCancel }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Unsaved Changes">
            <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 md:mx-0 md:h-10 md:w-10">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center md:mt-0 md:ml-4 md:text-left">
                    <div className="mt-2">
                        <p className="text-sm text-[var(--color-text-muted)]">You have unsaved changes. Do you want to save them before continuing?</p>
                    </div>
                </div>
            </div>
            <div className="mt-5 md:mt-4 flex flex-col-reverse md:flex-row-reverse md:space-x-2 md:space-x-reverse gap-2">
                <button type="button" className="ican-btn ican-btn-primary w-full md:w-auto" onClick={onSave}>Save & Continue</button>
                <button type="button" className="ican-btn ican-btn-danger w-full md:w-auto" onClick={onDiscard}>Discard Changes</button>
                <button type="button" className="ican-btn ican-btn-secondary w-full md:w-auto" onClick={onCancel}>Cancel</button>
            </div>
        </Modal>
    );
};

export const UnsavedChangesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDirty, setIsDirtyState] = useState(false);
    const [saveAction, setSaveAction] = useState<(() => Promise<void>) | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [navigationCallback, setNavigationCallback] = useState<(() => void) | null>(null);

    const setIsDirty = useCallback((dirty: boolean, onSave?: () => Promise<void>) => {
        setIsDirtyState(dirty);
        setSaveAction(dirty && onSave ? () => onSave : null);
    }, []);

    const promptNavigation = useCallback((onConfirm: () => void) => {
        if (isDirty) {
            setNavigationCallback(() => onConfirm);
            setIsModalOpen(true);
        } else {
            onConfirm();
        }
    }, [isDirty]);

    const handleSave = async () => {
        if (saveAction) await saveAction();
        setIsDirtyState(false);
        setSaveAction(null);
        setIsModalOpen(false);
        if (navigationCallback) navigationCallback();
        setNavigationCallback(null);
    };

    const handleDiscard = () => {
        setIsDirtyState(false);
        setSaveAction(null);
        setIsModalOpen(false);
        if (navigationCallback) navigationCallback();
        setNavigationCallback(null);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setNavigationCallback(null);
    };
    
    const value = { setIsDirty, promptNavigation };

    return (
        <UnsavedChangesContext.Provider value={value}>
            {children}
            <UnsavedChangesModal 
                isOpen={isModalOpen}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onCancel={handleCancel}
            />
        </UnsavedChangesContext.Provider>
    );
};

export const useUnsavedChanges = (): UnsavedChangesContextType => {
    const context = useContext(UnsavedChangesContext);
    if (!context) {
        throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
    }
    return context;
};
