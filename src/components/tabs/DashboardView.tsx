import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Account, Budget, Currency, Transaction } from '../../types.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { parseLocalDate } from '../../lib/date.ts';

const SpendingTrendChart = lazy(() => import('../charts/SpendingTrendChart.tsx'));

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: Account[];
  budget: Budget;
  currency: Currency;
  onViewAllTransactions: () => void;
}

function StatCard({
  label,
  value,
  currency,
  type = 'normal',
}: {
  label: string;
  value: number;
  currency: Currency;
  type?: 'income' | 'expense' | 'normal';
}) {
  const isDirectional = type === 'income' || type === 'expense';
  const displayValue = isDirectional ? Math.abs(value) : value;
  const valueColor =
    type === 'income' ? 'text-brand-success' : type === 'expense' ? 'text-brand-danger' : 'text-brand-text';

  return (
    <div className="bg-white p-5 lg:p-7 rounded-3xl shadow-brand border border-slate-100 hover:scale-[1.02] transition-transform">
      <p className="text-[9px] lg:text-[10px] uppercase font-bold tracking-widest text-brand-muted mb-2">{label}</p>
      <p className={`text-xl lg:text-2xl font-bold ${valueColor}`}>
        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
        {formatCurrency(displayValue, currency)}
      </p>
    </div>
  );
}

export default function DashboardView({
  transactions,
  accounts,
  budget,
  currency,
  onViewAllTransactions,
}: DashboardViewProps) {
  const [shouldLoadChart, setShouldLoadChart] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  const walletAccount = useMemo(
    () => accounts.find((account) => account.name.trim().toLowerCase() === 'wallet') || accounts[0],
    [accounts],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setShouldLoadChart(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const stats = useMemo(() => {
    const totalBalance = walletAccount
      ? transactions.reduce((sum, tx) => {
          if (tx.accountId === walletAccount.id) {
            if (tx.type === 'income') return sum + tx.amount;
            if (tx.type === 'expense' || tx.type === 'transfer') return sum - tx.amount;
          }
          if (tx.type === 'transfer' && tx.toAccountId === walletAccount.id) {
            return sum + tx.amount;
          }
          return sum;
        }, walletAccount.balance)
      : 0;

    const now = new Date();
    const currentMonthExpenses = transactions
      .filter((t) => {
        const d = parseLocalDate(t.date);
        return (
          t.type === 'expense' &&
          t.accountId === walletAccount?.id &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const currentMonthIncome = transactions
      .filter((t) => {
        const d = parseLocalDate(t.date);
        return (
          t.type === 'income' &&
          t.accountId === walletAccount?.id &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);

    return { totalBalance, currentMonthExpenses, currentMonthIncome };
  }, [transactions, walletAccount]);

  const recentTransactions = useMemo(() => {
    const withIndex = transactions.map((tx, index) => ({ tx, index }));
    withIndex.sort((a, b) => {
      const dateDiff = parseLocalDate(b.tx.date).getTime() - parseLocalDate(a.tx.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.index - a.index;
    });
    return withIndex.map((item) => item.tx).slice(0, 5);
  }, [transactions]);

  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const expenses = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.accountId === walletAccount?.id &&
            parseLocalDate(t.date).getMonth() === d.getMonth() &&
            parseLocalDate(t.date).getFullYear() === d.getFullYear(),
        )
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({ name: label, amount: expenses });
    }

    return months;
  }, [transactions, walletAccount]);

  const categoryTotals = useMemo(() => {
    const now = new Date();
    const totals: Record<string, number> = {};

    for (const t of transactions) {
      const d = parseLocalDate(t.date);
      const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

      if (t.type === 'expense' && t.accountId === walletAccount?.id && isCurrentMonth) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    }

    const sortedEntries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    let categoryEntries = sortedEntries;

    // Keep chart readable while preserving total spent by grouping smaller categories.
    if (sortedEntries.length > 5) {
      const primary = sortedEntries.slice(0, 4);
      const remainingTotal = sortedEntries.slice(4).reduce((sum, [, amount]) => sum + amount, 0);
      categoryEntries = [...primary, ['Other Categories', remainingTotal]];
    }

    const maxAmount = Math.max(...categoryEntries.map(([, amount]) => amount), 1);
    return { categoryEntries, maxAmount };
  }, [transactions, walletAccount]);

  const budgetSpentPercent = Math.min(100, (stats.currentMonthExpenses / (budget.monthlyLimit || 1)) * 100);
  const dailyStats = useMemo(() => {
    const now = new Date();
    const selectedDate = new Date(now);
    selectedDate.setDate(now.getDate() - selectedDayOffset);

    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const todaySpent = transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const d = parseLocalDate(t.date);
        return (
          t.accountId === walletAccount?.id &&
          d.getDate() === selectedDate.getDate() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyTarget = budget.monthlyLimit / Math.max(daysInMonth, 1);
    const progressRaw = (todaySpent / (dailyTarget || 1)) * 100;
    const progress = Math.min(100, progressRaw);

    return { todaySpent, dailyTarget, progress, progressRaw, selectedDate };
  }, [transactions, budget.monthlyLimit, walletAccount, selectedDayOffset]);

  const circleRadius = 48;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (dailyStats.progress / 100) * circleCircumference;

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-4 sm:gap-6 lg:gap-8"
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatCard label="Total Balance" value={stats.totalBalance} currency={currency} />
        <StatCard label="Monthly Income" value={stats.currentMonthIncome} type="income" currency={currency} />
        <StatCard label="Monthly Expenses" value={stats.currentMonthExpenses} type="expense" currency={currency} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-brand border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-brand-muted mb-2">Monthly Budget</p>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">{formatCurrency(budget.monthlyLimit, currency)}</h3>
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
              <span className="text-brand-muted">
                {formatCurrency(Math.max(0, budget.monthlyLimit - stats.currentMonthExpenses), currency)} Left
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-brand border border-slate-100 flex items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-brand-muted mb-2">Daily Spending</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-danger">
                  {formatCurrency(dailyStats.todaySpent, currency)}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedDayOffset((current) => Math.min(current + 1, 30))}
                  disabled={selectedDayOffset >= 30}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setSelectedDayOffset((current) => Math.max(current - 1, 0))}
                  disabled={selectedDayOffset <= 0}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => (
                <button
                  key={offset}
                  onClick={() => setSelectedDayOffset(offset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedDayOffset === offset ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {offset === 0 ? 'Today' : `${offset}d ago`}
                </button>
              ))}
            </div>

            <p className="text-xs text-brand-muted">
              {dailyStats.selectedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={circleRadius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
              <circle
                cx="60"
                cy="60"
                r={circleRadius}
                stroke={dailyStats.progressRaw > 100 ? '#ef4444' : '#3b82f6'}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
              {Math.round(dailyStats.progressRaw)}%
            </div>
          </div>
        </div>
      </section>

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

        {shouldLoadChart ? (
          <Suspense
            fallback={
              <div className="h-[220px] sm:h-[250px] lg:h-[300px] w-full bg-slate-50 rounded-2xl animate-pulse"></div>
            }
          >
            <SpendingTrendChart trendData={trendData} />
          </Suspense>
        ) : (
          <div className="h-[220px] sm:h-[250px] lg:h-[300px] w-full bg-slate-50 rounded-2xl animate-pulse"></div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pb-8">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-brand border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Recent Transactions</h3>
            <button onClick={onViewAllTransactions} className="text-brand-blue text-xs font-bold hover:underline">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-4 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-xl ${
                      tx.type === 'income'
                        ? 'bg-green-50 text-brand-success'
                        : tx.type === 'expense'
                          ? 'bg-red-50 text-brand-danger'
                          : 'bg-blue-50 text-brand-blue'
                    }`}
                  >
                    {tx.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tx.description}</p>
                    <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                      {parseLocalDate(tx.date).toLocaleDateString()} • {tx.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${
                    tx.type === 'income'
                      ? 'text-brand-success'
                      : tx.type === 'expense'
                        ? 'text-brand-danger'
                        : 'text-brand-blue'
                  }`}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-center py-10 text-brand-muted italic text-sm">No transactions yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-brand border border-slate-100">
          <h3 className="font-bold mb-6">Spending by Category (This Month)</h3>
          <div className="flex flex-col gap-5">
            {categoryTotals.categoryEntries.length === 0 && (
              <p className="text-sm text-brand-muted">No expense categories yet.</p>
            )}
            {categoryTotals.categoryEntries.map(([cat, amount], index) => {
              const percent = (amount / categoryTotals.maxAmount) * 100;

              const colorCycle = ['bg-blue-400', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400', 'bg-slate-400'];
              const colorClass = colorCycle[index % colorCycle.length];

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-brand-muted">{formatCurrency(amount, currency)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`h-full ${colorClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
