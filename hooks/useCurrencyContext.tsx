
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';

// FIX: Add missing properties to CurrencyContextType to support currency selection.
interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  supportedCurrencies: string[];
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const supportedCurrenciesList = ['QAR', 'USD', 'EUR', 'GBP', 'INR'];

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const savedCurrency = localStorage.getItem('appCurrency');
      return savedCurrency && supportedCurrenciesList.includes(savedCurrency) ? savedCurrency : 'QAR';
    } catch (e) {
      return 'QAR';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('appCurrency', currency);
    } catch (error) {
        console.error("Error saving currency to localStorage", error);
    }
  }, [currency]);

  const setCurrency = useCallback((newCurrency: string) => {
    if (supportedCurrenciesList.includes(newCurrency)) {
      setCurrencyState(newCurrency);
    }
  }, []);

  const formatCurrency = useCallback((value: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Use user's default locale for better compatibility
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (e) {
      // Fallback for environments that might not support the currency
      return `${currency} ${value.toFixed(2)}`;
    }
  }, [currency]);

  const value = {
    currency,
    setCurrency,
    supportedCurrencies: supportedCurrenciesList,
    isLoading: false, // Not loading from an API, so this is always false.
    formatCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
