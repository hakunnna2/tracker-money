/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ReceiptText,
  Settings,
  AlertTriangle,
  Plus,
  Wallet,
  Building2,
} from 'lucide-react';
import { Transaction, Budget, Account } from './types.ts';
import { database } from './lib/database.ts';
import { createId } from './lib/id.ts';
import { parseLocalDate } from './lib/date.ts';

const DashboardView = lazy(() => import('./components/tabs/DashboardView.tsx'));
const TransactionsView = lazy(() => import('./components/tabs/TransactionsView.tsx'));
const AccountsView = lazy(() => import('./components/tabs/AccountsView.tsx'));
const BudgetView = lazy(() => import('./components/tabs/BudgetView.tsx'));
const SettingsView = lazy(() => import('./components/tabs/SettingsView.tsx'));
const AddTransactionModal = lazy(() => import('./components/AddTransactionModal.tsx'));

type Tab = 'Dashboard' | 'Transactions' | 'Budget' | 'Accounts' | 'Settings';

function TabFallback() {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 min-h-[220px] flex items-center justify-center text-sm font-semibold text-brand-muted">
      Loading section...
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthlyLimit: 2000 });
  const currency = 'MAD' as const;
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const storedAccounts = database.getAccounts();
    const legacySeedIds = new Set(['acc-1', 'acc-2']);
    const hasOnlyLegacySeedAccounts =
      storedAccounts.length === 2 && storedAccounts.every((acc) => legacySeedIds.has(acc.id));

    if (hasOnlyLegacySeedAccounts) {
      database.saveAccounts([]);
      setAccounts([]);
    } else {
      setAccounts(storedAccounts);
    }

    setTransactions(database.getTransactions());
    setBudget(database.getBudget());

    database.saveSettings({ currency: 'MAD' });
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = parseLocalDate(t.date);
        return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const budgetSpentPercent = Math.min(100, (currentMonthExpenses / (budget.monthlyLimit || 1)) * 100);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: createId() };
    database.addTransaction(newTx);
    setTransactions(database.getTransactions());
    setToastMessage('Transaction saved');
  };

  const deleteTransaction = (id: string) => {
    database.deleteTransaction(id);
    setTransactions(database.getTransactions());
  };

  const updateTransaction = (updated: Transaction) => {
    database.updateTransaction(updated);
    setTransactions(database.getTransactions());
    setToastMessage('Transaction updated');
  };

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-brand-bg font-sans flex-col lg:flex-row">
      <nav className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-6 flex-col">
        <div className="flex items-center gap-3 text-brand-blue font-extrabold text-xl mb-10">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white">
            <Wallet size={20} />
          </div>
          SmartCopilot
        </div>

        <ul className="flex-1 space-y-1">
          {[
            { id: 'Dashboard', icon: LayoutDashboard },
            { id: 'Transactions', icon: ReceiptText },
            { id: 'Accounts', icon: Building2 },
            { id: 'Budget', icon: Settings },
            { id: 'Settings', icon: Settings },
          ].map((item) => (
            <li
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors font-medium text-sm
                ${activeTab === item.id ? 'bg-blue-50 text-brand-blue' : 'text-brand-muted hover:bg-slate-50'}
              `}
            >
              <item.icon size={18} />
              {item.id}
            </li>
          ))}
        </ul>

        <div className="pt-6 border-t border-slate-100">
          {budgetSpentPercent > 90 && (
            <div className="bg-red-50 border border-red-100 text-brand-danger p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} />
              Budget limit exceeded!
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 min-h-0 min-w-0 p-3 sm:p-4 lg:p-8 overflow-y-auto overflow-x-hidden relative flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Hello, Hakunna</h1>
            <p className="text-[11px] sm:text-xs lg:text-sm text-brand-muted">
              Your financial status for{' '}
              {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            disabled={accounts.length === 0}
            title={accounts.length === 0 ? 'Create an account first' : 'Add transaction'}
            className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </header>

        <AnimatePresence mode="wait">
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'Dashboard' && (
              <DashboardView
                transactions={transactions}
                accounts={accounts}
                budget={budget}
                currency={currency}
                onViewAllTransactions={() => setActiveTab('Transactions')}
              />
            )}

            {activeTab === 'Transactions' && (
              <TransactionsView
                transactions={transactions}
                onDelete={deleteTransaction}
                onEdit={(tx) => {
                  setEditingTransaction(tx);
                  setIsAddTxModalOpen(true);
                }}
                accounts={accounts}
                currency={currency}
              />
            )}

            {activeTab === 'Accounts' && (
              <AccountsView
                accounts={accounts}
                transactions={transactions}
                onAdd={(acc) => {
                  database.addAccount(acc);
                  setAccounts(database.getAccounts());
                  setToastMessage('Account created');
                }}
                onUpdate={(acc) => {
                  database.updateAccount(acc);
                  setAccounts(database.getAccounts());
                }}
                onDelete={(id) => {
                  const hasLinkedTransactions = transactions.some(
                    (t) => t.accountId === id || t.toAccountId === id,
                  );

                  if (hasLinkedTransactions) {
                    setToastMessage('Delete related transactions first');
                    return;
                  }

                  database.deleteAccount(id);
                  setAccounts(database.getAccounts());
                  setToastMessage('Account deleted');
                }}
                currency={currency}
              />
            )}

            {activeTab === 'Budget' && (
              <BudgetView
                budget={budget}
                onSave={(b) => {
                  database.saveBudget(b);
                  setBudget(b);
                }}
                onReset={() => {
                  const defaultBudget = { monthlyLimit: 2000 };
                  database.saveBudget(defaultBudget);
                  setBudget(defaultBudget);
                }}
                currency={currency}
              />
            )}

            {activeTab === 'Settings' && (
              <SettingsView
                onClearData={() => {
                  const confirmed = window.confirm(
                    'This will delete all transactions, accounts, and settings. Start fresh?',
                  );
                  if (!confirmed) {
                    return;
                  }

                  database.clearAllData();
                  window.location.reload();
                }}
              />
            )}
          </Suspense>
        </AnimatePresence>
      </main>

      {isAddTxModalOpen && (
        <Suspense fallback={null}>
          <AddTransactionModal
            onClose={() => {
              setIsAddTxModalOpen(false);
              setEditingTransaction(null);
            }}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            editingTransaction={editingTransaction}
            accounts={accounts}
            currency={currency}
          />
        </Suspense>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-40">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'Dashboard', icon: LayoutDashboard },
            { id: 'Transactions', icon: ReceiptText },
            { id: 'Accounts', icon: Building2 },
            { id: 'Budget', icon: Settings },
            { id: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`
                flex flex-col items-center justify-center gap-1 min-w-[78px] px-2 py-1 rounded-lg shrink-0 transition-colors
                ${activeTab === item.id ? 'text-brand-blue bg-blue-50' : 'text-slate-400'}
              `}
            >
              <item.icon size={19} />
              <span className="text-[10px] font-bold uppercase tracking-tight leading-none">
                {item.id === 'Transactions' ? 'History' : item.id}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {toastMessage && (
        <div className="fixed right-4 top-4 lg:top-6 z-[60] bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
