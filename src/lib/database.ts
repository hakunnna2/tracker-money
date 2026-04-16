
import { Transaction, Budget, Goal, Account, AppSettings } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'copilot_transactions',
  BUDGET: 'copilot_budget',
  GOALS: 'copilot_goals',
  ACCOUNTS: 'copilot_accounts',
  SETTINGS: 'copilot_settings',
};

export const database = {
  // Accounts
  getAccounts: (): Account[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },
  saveAccounts: (accounts: Account[]) => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  addAccount: (account: Account) => {
    const accounts = database.getAccounts();
    database.saveAccounts([...accounts, account]);
  },
  deleteAccount: (id: string) => {
    const accounts = database.getAccounts().filter(a => a.id !== id);
    database.saveAccounts(accounts);
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
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
    const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return data ? JSON.parse(data) : { monthlyLimit: 2000 };
  },
  saveBudget: (budget: Budget) => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
  },

  // Goals
  getGoals: (): Goal[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  },
  saveGoals: (goals: Goal[]) => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },
  addGoal: (goal: Goal) => {
    const goals = database.getGoals();
    database.saveGoals([...goals, goal]);
  },
  deleteGoal: (id: string) => {
    const goals = database.getGoals().filter(g => g.id !== id);
    database.saveGoals(goals);
  },

  // Settings
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { currency: 'MAD' };
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
  updateCurrency: (currency: 'MAD' | 'USD' | 'EUR') => {
    const settings = database.getSettings();
    database.saveSettings({ ...settings, currency });
  }
};
