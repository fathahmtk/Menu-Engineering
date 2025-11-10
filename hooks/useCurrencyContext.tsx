import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const API_URL = 'https://api.exchangerate-api.com/v4/latest/QAR';
const SUPPORTED_CURRENCIES = ['QAR', 'USD', 'EUR', 'GBP', 'INR'];

interface Rates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  rates: Rates;
  supportedCurrencies: string[];
  formatCurrency: (value: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('appCurrency') || 'QAR';
  });
  const [rates, setRates] = useState<Rates>({ QAR: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        const filteredRates = Object.keys(data.rates)
          .filter(key => SUPPORTED_CURRENCIES.includes(key))
          .reduce((obj, key) => {
            obj[key] = data.rates[key];
            return obj;
          }, {} as Rates);
        
        setRates(filteredRates);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        // Fallback to default QAR if API fails
        setRates({ QAR: 1 }); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchRates();
  }, []);

  const setCurrency = (newCurrency: string) => {
    localStorage.setItem('appCurrency', newCurrency);
    setCurrencyState(newCurrency);
  };

  const formatCurrency = useCallback((value: number) => {
    const rate = rates[currency] || 0;
    const convertedValue = value * rate;

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedValue);
    } catch (e) {
      // Fallback for unsupported currency codes in Intl
      return `${currency} ${convertedValue.toFixed(2)}`;
    }
  }, [currency, rates]);

  const value = {
    currency,
    setCurrency,
    rates,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    formatCurrency,
    isLoading,
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
