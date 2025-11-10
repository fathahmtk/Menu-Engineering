import React from 'react';
import { useCurrency } from '../hooks/useCurrencyContext';
import { Globe } from 'lucide-react';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, supportedCurrencies, isLoading } = useCurrency();

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(event.target.value);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }
  
  if(Object.keys(supportedCurrencies).length <= 1) return null;

  return (
    <div className="flex items-center space-x-2">
        <Globe size={20} className="text-text-secondary" />
        <select
            id="currency"
            name="currency"
            value={currency}
            onChange={handleCurrencyChange}
            className="block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-transparent"
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
