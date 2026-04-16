import { Currency } from '../types';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  MAD: 'د.م.',
  USD: '$',
  EUR: '€',
};

const CURRENCY_NAMES: Record<Currency, string> = {
  MAD: 'Moroccan Dirham',
  USD: 'US Dollar',
  EUR: 'Euro',
};

export function formatCurrency(amount: number, currency: Currency = 'MAD'): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (currency === 'MAD') {
    // For MAD, show format like "1,234.50 د.م."
    return `${amount.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

export function getCurrencyName(currency: Currency): string {
  return CURRENCY_NAMES[currency];
}

export function parseCurrencyInput(value: string): number {
  // Remove currency symbols and spaces, then parse
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
