
import { Transaction, Budget, Account, AppSettings } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'copilot_transactions',
  BUDGET: 'copilot_budget',
  ACCOUNTS: 'copilot_accounts',
  SETTINGS: 'copilot_settings',
};

function safeRead<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    return fallback;
  }

  try {
    return JSON.parse(data) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export const database = {
  // Accounts
  getAccounts: (): Account[] => {
    return safeRead<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
  },
  saveAccounts: (accounts: Account[]) => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  addAccount: (account: Account) => {
    const accounts = database.getAccounts();
    database.saveAccounts([...accounts, account]);
  },
  updateAccount: (updated: Account) => {
    const accounts = database.getAccounts().map((account) =>
      account.id === updated.id ? updated : account
    );
    database.saveAccounts(accounts);
  },
  deleteAccount: (id: string) => {
    const accounts = database.getAccounts().filter(a => a.id !== id);
    database.saveAccounts(accounts);
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    return safeRead<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },
  addTransaction: (transaction: Transaction) => {
    const transactions = database.getTransactions();
    database.saveTransactions([...transactions, transaction]);
  },
  updateTransaction: (updated: Transaction) => {
    const transactions = database.getTransactions().map(t => t.id === updated.id ? updated : t);
    database.saveTransactions(transactions);
  },
  deleteTransaction: (id: string) => {
    const transactions = database.getTransactions().filter(t => t.id !== id);
    database.saveTransactions(transactions);
  },

  // Budget
  getBudget: (): Budget => {
    return safeRead<Budget>(STORAGE_KEYS.BUDGET, { monthlyLimit: 2000 });
  },
  saveBudget: (budget: Budget) => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
  },

  // Settings
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return { currency: 'MAD' };
    }

    try {
      const parsed = JSON.parse(data) as Partial<AppSettings>;
      if (parsed.currency === 'MAD') {
        return { currency: parsed.currency };
      }
      return { currency: 'MAD' };
    } catch {
      return { currency: 'MAD' };
    }
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
  updateCurrency: (currency: 'MAD') => {
    const settings = database.getSettings();
    database.saveSettings({ ...settings, currency });
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('copilot_goals');
  }
};
