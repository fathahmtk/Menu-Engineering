import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppSettings, AppSettingsContextType } from '../types';

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    foodCostTarget: 30,
    workingDaysPerMonth: 28,
    hoursPerDay: 10,
    totalDishesProduced: 10000,
    totalDishesSold: 8000,
    dashboard: {
        totalRecipes: true,
        avgMenuProfit: true,
    },
};

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                // Ensure dashboard settings are merged correctly
                const mergedSettings = { ...defaultSettings, ...parsed };
                mergedSettings.dashboard = { ...defaultSettings.dashboard, ...(parsed.dashboard || {}) };
                return mergedSettings;
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
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            // Deep merge dashboard settings if they are part of the update
            if (newSettings.dashboard) {
                updated.dashboard = { ...prev.dashboard, ...newSettings.dashboard };
            }
            return updated;
        });
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