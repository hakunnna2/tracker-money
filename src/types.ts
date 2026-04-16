
export type TransactionType = 'income' | 'expense' | 'transfer';

export type Category = 'Food' | 'Transport' | 'Rent' | 'Leisure' | 'Other' | 'Income' | 'Transfer';

export type Currency = 'MAD';

export interface AppSettings {
  currency: Currency;
}

export interface Account {
  id: string;
  name: string;
  type: 'Checking' | 'Credit Card' | 'Cash';
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
