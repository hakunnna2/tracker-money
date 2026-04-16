import { Currency } from '../types';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  MAD: 'MAD',
};

const CURRENCY_NAMES: Record<Currency, string> = {
  MAD: 'Moroccan Dirham',
};

export function formatCurrency(amount: number, currency: Currency = 'MAD'): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
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
