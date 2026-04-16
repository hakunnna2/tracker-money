
export type TransactionType = 'income' | 'expense' | 'transfer';

export type Category = 'Food' | 'Transport' | 'Rent' | 'Leisure' | 'Other' | 'Income' | 'Transfer';

export type Currency = 'MAD' | 'USD' | 'EUR';

export interface AppSettings {
  currency: Currency;
}

export interface Account {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash';
  balance: number; // Initial balance or current calculated balance
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO string
  description: string;
  accountId: string;
  toAccountId?: string; // Only for transfers
}

export interface Budget {
  monthlyLimit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface PredictionResult {
  endOfMonthForecast: number;
  projectedSavings: number;
}
