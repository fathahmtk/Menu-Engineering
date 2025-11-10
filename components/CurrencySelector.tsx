import React from 'react';
import { useCurrency } from '../hooks/useCurrencyContext';
import { Globe } from 'lucide-react';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, supportedCurrencies, isLoading } = useCurrency();

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(event.target.value);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse">...</div>;
  }
  
  if(Object.keys(supportedCurrencies).length <= 1) return null;

  return (
    <div className="flex items-center space-x-2">
        <Globe size={20} className="text-muted-foreground" />
        <select
            id="currency"
            name="currency"
            value={currency}
            onChange={handleCurrencyChange}
            className="block w-full pl-2 pr-8 py-1 text-base border-0 focus:outline-none focus:ring-0 sm:text-sm rounded-md bg-transparent text-muted-foreground"
            aria-label="Select currency"
        >
            {supportedCurrencies.map((code) => (
                <option key={code} value={code}>
                    {code}
                </option>
            ))}
        </select>
    </div>
  );
};

export default CurrencySelector;