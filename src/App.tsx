/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Settings, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ChevronRight,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  PlusCircle,
  Download
} from 'lucide-react';
import { Transaction, Budget, Goal, Category, TransactionType, Account, Currency } from './types.ts';
import { database } from './lib/database.ts';
import { predictEndOfMonth } from './lib/ml.ts';
import { formatCurrency } from './lib/currency.ts';
import { clearAllAuthData } from './lib/auth.ts';

type Tab = 'Dashboard' | 'Transactions' | 'Budget' | 'Predictions' | 'Goals' | 'Accounts' | 'Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthlyLimit: 2000 });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currency, setCurrency] = useState<Currency>('MAD');
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);

  // Load data
  useEffect(() => {
    // Accounts
    let currentAccounts = database.getAccounts();
    if (currentAccounts.length === 0) {
      currentAccounts = [
        { id: 'acc-1', name: 'Main Checking', type: 'Checking', balance: 0 },
        { id: 'acc-2', name: 'Savings Account', type: 'Savings', balance: 0 }
      ];
      database.saveAccounts(currentAccounts);
    }
    setAccounts(currentAccounts);

    // Transactions
    const existingTx = database.getTransactions();
    if (existingTx.length === 0) {
      const now = new Date();
      const dummyTx: Transaction[] = [];
      
      // Generate some historical data for the last 6 months
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
        const iso = monthDate.toISOString();
        
        // Income
        dummyTx.push({ id: `inc-${i}`, amount: 4500 + Math.random() * 1000, type: 'income', category: 'Income', date: iso, description: 'Monthly Salary', accountId: 'acc-1' });
        
        // Expenses
        const rentAmount = 1200;
        const foodAmount = 400 + Math.random() * 200;
        const tranAmount = 100 + Math.random() * 100;
        const leisureAmount = 200 + Math.random() * 300;

        dummyTx.push({ id: `exp-rent-${i}`, amount: rentAmount, type: 'expense', category: 'Rent', date: iso, description: 'Apartment Rent', accountId: 'acc-1' });
        dummyTx.push({ id: `exp-food-${i}`, amount: foodAmount, type: 'expense', category: 'Food', date: iso, description: 'Groceries', accountId: 'acc-1' });
        dummyTx.push({ id: `exp-tran-${i}`, amount: tranAmount, type: 'expense', category: 'Transport', date: iso, description: 'Fuel/Commute', accountId: 'acc-1' });
        dummyTx.push({ id: `exp-lei-${i}`, amount: leisureAmount, type: 'expense', category: 'Leisure', date: iso, description: 'Entertainment', accountId: 'acc-1' });
      }

      database.saveTransactions(dummyTx);
      setTransactions(dummyTx);
    } else {
      setTransactions(existingTx);
    }
    
    setBudget(database.getBudget());
    const settings = database.getSettings();
    setCurrency(settings.currency);
    
    const existingGoals = database.getGoals();
    if (existingGoals.length === 0) {
      const dummyGoals = [
        { id: 'g1', name: 'New Laptop', targetAmount: 2500, currentAmount: 850 },
        { id: 'g2', name: 'Summer Trip', targetAmount: 5000, currentAmount: 1200 },
      ];
      database.saveGoals(dummyGoals);
      setGoals(dummyGoals);
    } else {
      setGoals(existingGoals);
    }
  }, []);


  // Stats
  const stats = useMemo(() => {
    const totalBalance = transactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc; // Transfer is internal
    }, 0);
    
    const now = new Date();
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
      .reduce((acc, t) => acc + t.amount, 0);
    const currentMonthIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === now.getMonth())
      .reduce((acc, t) => acc + t.amount, 0);
    
    return { totalBalance, currentMonthExpenses, currentMonthIncome };
  }, [transactions]);

  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const expenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear())
        .reduce((sum, t) => sum + t.amount, 0);
      months.push({ name: label, amount: expenses });
    }
    return months;
  }, [transactions]);

  const prediction = useMemo(() => predictEndOfMonth(transactions, budget.monthlyLimit), [transactions, budget]);

  const budgetSpentPercent = Math.min(100, (stats.currentMonthExpenses / (budget.monthlyLimit || 1)) * 100);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: crypto.randomUUID() };
    database.addTransaction(newTx);
    setTransactions(database.getTransactions());
  };

  const deleteTransaction = (id: string) => {
    database.deleteTransaction(id);
    setTransactions(database.getTransactions());
  };

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-brand-bg font-sans flex-col lg:flex-row">
      {/* Sidebar - Desktop Only */}
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
            { id: 'Predictions', icon: TrendingUp },
            { id: 'Goals', icon: Target },
            { id: 'Settings', icon: Settings },
          ].map((item) => (
            <li 
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors font-medium text-sm
                ${activeTab === item.id 
                  ? 'bg-blue-50 text-brand-blue' 
                  : 'text-brand-muted hover:bg-slate-50'}
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

      {/* Main Content */}
      <main className="flex-1 min-h-0 min-w-0 p-3 sm:p-4 lg:p-8 overflow-y-auto overflow-x-hidden relative flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Hello, Hakunna</h1>
            <p className="text-[11px] sm:text-xs lg:text-sm text-brand-muted">
              Your financial status for {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </div>
          <button 
            onClick={() => setIsAddTxModalOpen(true)}
            className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-100 cursor-pointer"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 sm:gap-6 lg:gap-8"
            >
              {/* Stats Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <StatCard label="Total Balance" value={stats.totalBalance} />
                <StatCard label="Monthly Income" value={stats.currentMonthIncome} type="income" />
                <StatCard label="Monthly Expenses" value={stats.currentMonthExpenses} type="expense" />
              </section>

              {/* Middle Row */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[180px] lg:min-h-[200px]">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <span className="font-semibold text-sm lg:text-base">Prediction Engine</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] lg:text-[10px] uppercase tracking-wider font-bold">LR Model v1.0</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 relative z-10">
                    <div>
                      <p className="text-slate-400 text-xs lg:text-sm">End of Month Forecast</p>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold my-1 lg:my-2 ml-0">${prediction.forecast.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                      <p className="text-[10px] text-slate-500">Projected total spending</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-slate-400 text-xs lg:text-sm">Projected Savings</p>
                      <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold my-1 lg:my-2 ml-0 ${prediction.savings >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {prediction.savings >= 0 ? '+' : ''}${prediction.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-[10px] text-slate-500">Remaining after forecast</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-brand border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-muted mb-2">Monthly Budget</p>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">${budget.monthlyLimit.toLocaleString()}</h3>
                  </div>
                  <div className="mt-4 lg:mt-6 flex flex-col gap-2">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${budgetSpentPercent}%` }}
                        className={`h-full ${budgetSpentPercent > 90 ? 'bg-brand-danger' : 'bg-brand-blue'} transition-all`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>{Math.round(budgetSpentPercent)}% Spent</span>
                      <span className="text-brand-muted">${Math.max(0, budget.monthlyLimit - stats.currentMonthExpenses).toLocaleString()} Left</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Trend Chart Row */}
              <section className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-brand border border-slate-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                  <div>
                    <h3 className="font-bold text-lg">Spending Trend</h3>
                    <p className="text-xs text-brand-muted">Monthly expenses (last 6 months)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-blue rounded-full"></div>
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Expenses</span>
                  </div>
                </div>
                <div className="h-[220px] sm:h-[250px] lg:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={window.innerWidth < 640 ? 25 : 40}>
                        {trendData.map((_entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === trendData.length - 1 ? '#3b82f6' : '#94a3b8'} 
                            fillOpacity={index === trendData.length - 1 ? 1 : 0.3}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Bottom Row */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pb-8">
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-brand border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold">Recent Transactions</h3>
                    <button onClick={() => setActiveTab('Transactions')} className="text-brand-blue text-xs font-bold hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="py-4 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${tx.type === 'income' ? 'bg-green-50 text-brand-success' : 'bg-red-50 text-brand-danger'}`}>
                            {tx.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{tx.description}</p>
                            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                              {new Date(tx.date).toLocaleDateString()} • {tx.category}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-brand-success' : 'text-brand-danger'}`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-center py-10 text-brand-muted italic text-sm">No transactions yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-brand border border-slate-100">
                  <h3 className="font-bold mb-6">Spending by Category</h3>
                  <div className="flex flex-col gap-5">
                    {['Food', 'Transport', 'Rent', 'Leisure', 'Other'].map(cat => {
                      const amount = transactions
                        .filter(t => t.type === 'expense' && t.category === cat)
                        .reduce((acc, t) => acc + t.amount, 0);
                      const maxAmountArr = ['Food', 'Transport', 'Rent', 'Leisure', 'Other'].map(c => 
                        transactions.filter(t => t.type === 'expense' && t.category === c).reduce((acc, t) => acc + t.amount, 0)
                      );
                      const maxAmount = Math.max(...maxAmountArr, 1);
                      const percent = (amount / maxAmount) * 100;
                      
                      const colors: Record<string, string> = {
                        Food: 'bg-blue-400',
                        Transport: 'bg-amber-400',
                        Rent: 'bg-emerald-400',
                        Leisure: 'bg-rose-400',
                        Other: 'bg-slate-400'
                      };

                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700">{cat}</span>
                            <span className="text-brand-muted">${amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              className={`h-full ${colors[cat] || 'bg-slate-400'}`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'Transactions' && (
            <TransactionsView 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              accounts={accounts}
            />
          )}

          {activeTab === 'Accounts' && (
            <AccountsView 
              accounts={accounts} 
              transactions={transactions}
              onAdd={(acc) => {
                database.addAccount(acc);
                setAccounts(database.getAccounts());
              }}
              onDelete={(id) => {
                database.deleteAccount(id);
                setAccounts(database.getAccounts());
              }}
            />
          )}

          {activeTab === 'Budget' && (
            <BudgetView 
              budget={budget} 
              onSave={(b) => {
                database.saveBudget(b);
                setBudget(b);
              }} 
            />
          )}

          {activeTab === 'Predictions' && (
            <PredictionsView prediction={prediction} transactions={transactions} />
          )}

          {activeTab === 'Goals' && (
            <GoalsView 
              goals={goals} 
              onAdd={(g) => {
                database.addGoal(g);
                setGoals(database.getGoals());
              }}
              onDelete={(id) => {
                database.deleteGoal(id);
                setGoals(database.getGoals());
              }}
            />
          )}

          {activeTab === 'Settings' && (
            <SettingsView 
              currency={currency}
              onCurrencyChange={(curr) => {
                setCurrency(curr);
                database.updateCurrency(curr);
              }}
              onClearData={() => {
                const confirmed = window.confirm('This will delete all transactions, goals, accounts, budget settings, and your PIN. Start fresh?');
                if (!confirmed) {
                  return;
                }

                clearAllAuthData();
                database.clearAllData();
                window.location.reload();
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Add Transaction Modal */}
      {isAddTxModalOpen && (
        <AddTransactionModal 
          onClose={() => setIsAddTxModalOpen(false)} 
          onAdd={addTransaction} 
          accounts={accounts}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-between items-center z-40">
        {[
          { id: 'Dashboard', icon: LayoutDashboard },
          { id: 'Transactions', icon: ReceiptText },
          { id: 'Accounts', icon: Building2 },
          { id: 'Budget', icon: Settings },
          { id: 'Predictions', icon: TrendingUp },
          { id: 'Goals', icon: Target },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`
              flex flex-col items-center gap-1 flex-1 transition-colors
              ${activeTab === item.id ? 'text-brand-blue' : 'text-slate-400'}
            `}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{item.id === 'Transactions' ? 'History' : item.id}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function StatCard({ label, value, type = 'normal' }: { label: string; value: number; type?: 'income' | 'expense' | 'normal' }) {
  const valueColor = type === 'income' ? 'text-brand-success' : type === 'expense' ? 'text-brand-danger' : 'text-brand-text';
  return (
    <div className="bg-white p-5 lg:p-7 rounded-3xl shadow-brand border border-slate-100 hover:scale-[1.02] transition-transform">
      <p className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest text-brand-muted mb-2">{label}</p>
      <p className={`text-xl lg:text-2xl font-bold ${valueColor}`}>
        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
        ${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Sub-Views
function TransactionsView({ transactions, onDelete, accounts }: { transactions: Transaction[], onDelete: (id: string) => void, accounts: Account[] }) {
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Account', 'To Account', 'Description', 'Amount'];
    const rows = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
      const account = accounts.find(a => a.id === tx.accountId);
      const toAccount = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;
      return [
        new Date(tx.date).toLocaleDateString(),
        tx.type,
        tx.category,
        account?.name || 'Unknown',
        toAccount?.name || '',
        `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
        tx.type === 'income' ? tx.amount : -tx.amount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_copilot_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">All Transactions</h2>
        <button 
          onClick={exportToCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase tracking-widest text-brand-muted border-b border-slate-100">
            <tr>
              <th className="pb-4 font-bold">Date</th>
              <th className="pb-4 font-bold">Category</th>
              <th className="pb-4 font-bold">Account</th>
              <th className="pb-4 font-bold">Description</th>
              <th className="pb-4 font-bold text-right">Amount</th>
              <th className="pb-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
              const account = accounts.find(a => a.id === tx.accountId);
              return (
                <tr key={tx.id} className="text-sm">
                  <td className="py-5 font-medium">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-5 text-slate-500 font-medium">
                    {tx.type === 'transfer' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[80px]">{account?.name}</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className="truncate max-w-[80px]">{accounts.find(a => a.id === tx.toAccountId)?.name}</span>
                      </div>
                    ) : (
                      account?.name || 'Unknown'
                    )}
                  </td>
                  <td className="py-5 text-slate-600 max-w-[200px] truncate">{tx.description}</td>
                  <td className={`py-5 font-bold text-right ${tx.type === 'income' ? 'text-brand-success' : tx.type === 'expense' ? 'text-brand-danger' : 'text-brand-blue'}`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}${tx.amount.toLocaleString()}
                  </td>
                  <td className="py-5 text-right">
                    <button onClick={() => onDelete(tx.id)} className="text-slate-300 hover:text-brand-danger transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-center py-20 text-brand-muted">No transactions registered yet.</p>}
      </div>
    </motion.div>
  );
}

function AccountsView({ accounts, transactions, onAdd, onDelete }: { 
  accounts: Account[], 
  transactions: Transaction[],
  onAdd: (acc: Account) => void,
  onDelete: (id: string) => void 
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('Checking');

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 pb-10">
      <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
        <h2 className="text-xl font-bold mb-2">My Bank Accounts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map(acc => {
            const balance = transactions
              .reduce((sum, t) => {
                if (t.accountId === acc.id) {
                  if (t.type === 'income') return sum + t.amount;
                  if (t.type === 'expense' || t.type === 'transfer') return sum - t.amount;
                }
                if (t.type === 'transfer' && t.toAccountId === acc.id) {
                  return sum + t.amount;
                }
                return sum;
              }, 0);
            
            return (
              <div key={acc.id} className="bg-white p-6 rounded-3xl shadow-brand border border-slate-100 flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Building2 size={20} />
                  </div>
                  <button onClick={() => onDelete(acc.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-brand-danger transition-all cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">{acc.type}</p>
                  <h4 className="font-bold text-lg mt-1">{acc.name}</h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-3xl font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 h-fit"
      >
        <h3 className="font-bold mb-6">Add New Account</h3>
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5 tracking-wider">Account Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Business"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5 tracking-wider">Account Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
            >
              <option>Checking</option>
              <option>Savings</option>
              <option>Credit Card</option>
              <option>Cash</option>
            </select>
          </div>
          <button 
            onClick={() => {
              if (!name) return;
              onAdd({ id: crypto.randomUUID(), name, type, balance: 0 });
              setName('');
            }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            Create Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BudgetView({ budget, onSave }: { budget: Budget, onSave: (b: Budget) => void }) {
  const [val, setVal] = useState(budget.monthlyLimit);
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 max-w-md"
    >
      <h2 className="text-xl font-bold mb-6">Budget Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-brand-muted uppercase block mb-2">Monthly Spending Limit</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input 
              type="number" 
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </div>
        <p className="text-xs text-brand-muted leading-relaxed">
          Set a realistic monthly limit to keep track of your spending. We'll alert you if you get close to this amount based on your transactions and predictions.
        </p>
        <button 
          onClick={() => onSave({ monthlyLimit: val })}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Save Budget
        </button>
      </div>
    </motion.div>
  );
}

function PredictionsView({ prediction, transactions }: { prediction: any, transactions: Transaction[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-xl font-bold mb-8">AI Forecast</h2>
          <div className="space-y-8">
            <div>
              <p className="text-slate-400 text-sm">Projected End of Month Expense</p>
              <h3 className="text-4xl font-bold">${prediction.forecast.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Projected Balance (Month End)</p>
              <h3 className={`text-4xl font-bold ${prediction.savings >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                {prediction.savings >= 0 ? '+' : ''}${prediction.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100">
          <h2 className="text-xl font-bold mb-6">Model Insights</h2>
          <p className="text-sm text-brand-muted leading-relaxed mb-6">
            Our Linear Regression model analyzes your daily cumulative spending patterns to estimate where you'll end up by the end of the month.
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <TrendingUp size={18} className="text-brand-blue" />
              <span>Trend: {prediction.savings < 0 ? 'High spending velocity' : 'Stable spending'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <AlertTriangle size={18} className="text-brand-warning" />
              <span>Reliability: {transactions.length > 5 ? 'Medium-High' : 'Low (Needs more data)'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GoalsView({ goals, onAdd, onDelete }: { goals: Goal[], onAdd: (g: Goal) => void, onDelete: (id: string) => void }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(1000);
  const [current, setCurrent] = useState(0);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 lg:p-8 shadow-brand border border-slate-100 h-fit"
      >
        <h2 className="text-xl font-bold mb-6">Saving Goals</h2>
        <div className="flex flex-col gap-6">
          {goals.map(goal => {
            const percent = Math.min(100, (goal.currentAmount / (goal.targetAmount || 1)) * 100);
            return (
              <div key={goal.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 group transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{goal.name}</h4>
                    <p className="text-xs text-brand-muted">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</p>
                  </div>
                  <button onClick={() => onDelete(goal.id)} className="text-slate-300 hover:text-brand-danger transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full bg-brand-success"
                  />
                </div>
                <p className="mt-2 text-[10px] font-bold text-brand-success uppercase tracking-widest">{Math.round(percent)}% Complete</p>
              </div>
            )
          })}
          {goals.length === 0 && <p className="text-center py-10 text-brand-muted italic text-sm">No goals added yet.</p>}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 h-fit"
      >
        <h3 className="font-bold mb-6">New Saving Goal</h3>
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5 tracking-wider">Goal Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Macbook"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5 tracking-wider">Target Amount ($)</label>
              <input 
                type="number" 
                value={target} 
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5 tracking-wider">Current Saved ($)</label>
              <input 
                type="number" 
                value={current} 
                onChange={(e) => setCurrent(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          <button 
            onClick={() => {
              if (!name) return;
              onAdd({ id: crypto.randomUUID(), name, targetAmount: target, currentAmount: current });
              setName('');
              setTarget(1000);
              setCurrent(0);
            }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-2 cursor-pointer"
          >
            Create Goal
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AddTransactionModal({ onClose, onAdd, accounts }: { onClose: () => void, onAdd: (t: Omit<Transaction, 'id'>) => void, accounts: Account[] }) {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<Category>('Food');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[92dvh] overflow-y-auto"
      >
        <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold">New Transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">✕</button>
        </div>
        <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {[
              { id: 'expense', label: 'Expense', color: 'text-brand-danger' },
              { id: 'income', label: 'Income', color: 'text-brand-success' },
              { id: 'transfer', label: 'Transfer', color: 'text-brand-blue' },
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => { 
                  setType(t.id as TransactionType); 
                  if (t.id === 'income') setCategory('Income');
                  else if (t.id === 'transfer') setCategory('Transfer');
                  else if (category === 'Income' || category === 'Transfer') setCategory('Food');
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${type === t.id ? `bg-white shadow-sm ${t.color}` : 'text-slate-500'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className={type === 'transfer' ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">
                  {type === 'transfer' ? 'From Account' : 'Account'}
                </label>
                <select 
                  value={accountId} 
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              
              {type === 'transfer' && (
                <div>
                  <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">To Account</label>
                  <select 
                    value={toAccountId} 
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
                  >
                    {accounts.filter(acc => acc.id !== accountId).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">Amount ($)</label>
                <input 
                  type="number" 
                  value={amount || ''} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as Category)}
                  disabled={type === 'income' || type === 'transfer'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
                >
                  {type === 'expense' ? (
                    <>
                      <option>Food</option>
                      <option>Transport</option>
                      <option>Rent</option>
                      <option>Leisure</option>
                      <option>Other</option>
                    </>
                  ) : (
                    <option>{type === 'income' ? 'Income' : 'Transfer'}</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">Description</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'transfer' ? 'Transfer description' : 'What was this for?'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>

          <button 
            onClick={() => {
              if (amount <= 0 || !description || !accountId) return;
              if (type === 'transfer' && accountId === toAccountId) return;
              
              onAdd({ 
                amount, 
                type, 
                category, 
                date, 
                description, 
                accountId, 
                toAccountId: type === 'transfer' ? toAccountId : undefined 
              });
              onClose();
            }}
            className="w-full bg-brand-blue text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 cursor-pointer"
          >
            {type === 'transfer' ? 'Confirm Transfer' : 'Add Transaction'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsView({ currency, onCurrencyChange, onClearData }: { currency: Currency, onCurrencyChange: (curr: Currency) => void, onClearData: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8"
    >
      <div className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 h-fit">
        <h2 className="text-xl font-bold mb-6">App Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-brand-muted uppercase block mb-2 tracking-widest">Currency</label>
            <select 
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
            >
              <option value="MAD">Moroccan Dirham (د.م.)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
            <p className="text-xs text-brand-muted mt-2">Choose your preferred currency for all transactions and balances</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-brand border border-slate-100 h-fit">
        <h2 className="text-xl font-bold mb-6">Account</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">Current User</p>
            <p className="text-lg font-semibold">Hakunna</p>
          </div>
          <button 
            onClick={onClearData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-colors"
          >
            <Trash2 size={18} />
            Clear data and start fresh
          </button>
          <p className="text-xs text-brand-muted text-center">You will be prompted to enter your PIN on next login</p>
        </div>
      </div>

      <div className="lg:col-span-2 bg-blue-50 rounded-3xl p-8 border border-blue-100">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-blue-600" />
          Security Information
        </h3>
        <ul className="space-y-3 text-sm text-slate-700">
          <li>✓ Your PIN is hashed and never stored in plain text</li>
          <li>✓ Biometric authentication uses your device's secure enclave</li>
          <li>✓ All data is stored locally on your device</li>
          <li>✓ No personal data is sent to external servers</li>
        </ul>
      </div>
    </motion.div>
  );
}

