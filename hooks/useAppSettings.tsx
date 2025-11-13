import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppSettings, AppSettingsContextType } from '../types';

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    foodCostTarget: 30,
    dashboard: {
        inventoryValue: true,
        lowStockItems: true,
        totalRecipes: true,
        avgMenuProfit: true,
    }
};

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                // Merge with defaults to handle cases where new settings are added
                return { ...defaultSettings, ...parsed, dashboard: {...defaultSettings.dashboard, ...parsed.dashboard} };
            }
        } catch (error) {
            console.error("Error parsing app settings from localStorage", error);
        }
        return defaultSettings;
    });

    useEffect(() => {
        try {
            localStorage.setItem('appSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Error saving app settings to localStorage", error);
        }
    }, [settings]);

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({
            ...prev,
            ...newSettings,
            dashboard: { ...prev.dashboard, ...newSettings.dashboard }
        }));
    }, []);

    return (
        <AppSettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </AppSettingsContext.Provider>
    );
};

export const useAppSettings = (): AppSettingsContextType => {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useAppSettings must be used within an AppSettingsProvider');
    }
    return context;
};
