import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'UGX' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  formatMoney: (amount: number) => string;
  convert: (amount: number) => number;
  rate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// 1 USD = 3700 UGX (Static for demo, but can be dynamic)
const EXCHANGE_RATE = 3700;

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('UGX');

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'UGX' ? 'USD' : 'UGX');
  };

  const convert = (amountInUgx: number) => {
    if (currency === 'UGX') return amountInUgx;
    return amountInUgx / EXCHANGE_RATE;
  };

  const formatMoney = (amountInUgx: number) => {
    const val = convert(amountInUgx);
    if (currency === 'UGX') {
      return `UGX ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatMoney, convert, rate: EXCHANGE_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};