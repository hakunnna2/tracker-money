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

type AnalyticsRange = 'today' | 'thisMonth' | 'lastMonth' | 'custom';

function toDateInputValue(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function getRangeBounds(range: AnalyticsRange, customStart: string, customEnd: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === 'today') {
    return { start: todayStart, end: todayEnd, label: 'Today' };
  }

  if (range === 'thisMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      label: 'This Month',
    };
  }

  if (range === 'lastMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      label: 'Last Month',
    };
  }

  const startSource = customStart ? parseLocalDate(customStart) : todayStart;
  const endSource = customEnd ? parseLocalDate(customEnd) : todayEnd;
  const start = new Date(Math.min(startSource.getTime(), endSource.getTime()));
  const end = new Date(Math.max(startSource.getTime(), endSource.getTime()));
  end.setHours(23, 59, 59, 999);

  return { start, end, label: 'Custom Range' };
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
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const now = new Date();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [customEndDate, setCustomEndDate] = useState(() => toDateInputValue(new Date()));

  const walletAccount = useMemo(
    () => accounts.find((account) => account.name.trim().toLowerCase() === 'wallet') || accounts[0],
    [accounts],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setShouldLoadChart(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const analyticsBounds = useMemo(
    () => getRangeBounds(analyticsRange, customStartDate, customEndDate),
    [analyticsRange, customStartDate, customEndDate],
  );

  const walletTransactions = useMemo(
    () => transactions.filter((t) => t.accountId === walletAccount?.id || t.toAccountId === walletAccount?.id),
    [transactions, walletAccount],
  );

  const walletTransactionsInRange = useMemo(() => {
    return walletTransactions.filter((t) => {
      const d = parseLocalDate(t.date);
      return d.getTime() >= analyticsBounds.start.getTime() && d.getTime() <= analyticsBounds.end.getTime();
    });
  }, [walletTransactions, analyticsBounds]);

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

    const currentRangeExpenses = walletTransactionsInRange
      .filter((t) => {
        return t.type === 'expense' && t.accountId === walletAccount?.id;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const currentRangeIncome = walletTransactionsInRange
      .filter((t) => {
        return t.type === 'income' && t.accountId === walletAccount?.id;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    return { totalBalance, currentRangeExpenses, currentRangeIncome };
  }, [transactions, walletAccount, walletTransactionsInRange]);

  const recentTransactions = useMemo(() => {
    const withIndex = walletTransactionsInRange.map((tx, index) => ({ tx, index }));
    withIndex.sort((a, b) => {
      const dateDiff = parseLocalDate(b.tx.date).getTime() - parseLocalDate(a.tx.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.index - a.index;
    });
    return withIndex.map((item) => item.tx).slice(0, 5);
  }, [walletTransactionsInRange]);

  const trendData = useMemo(() => {
    const start = analyticsBounds.start;
    const end = analyticsBounds.end;
    const daySpan = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const shouldGroupByDay = daySpan <= 45;

    const groups: Record<string, number> = {};

    for (const t of walletTransactionsInRange) {
      if (t.type !== 'expense' || t.accountId !== walletAccount?.id) continue;
      const d = parseLocalDate(t.date);
      const key = shouldGroupByDay
        ? [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
        : [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0')].join('-');
      groups[key] = (groups[key] || 0) + t.amount;
    }

    const labels = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return labels.map((label) => ({
      name: shouldGroupByDay
        ? parseLocalDate(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : new Date(`${label}-01`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      amount: groups[label],
    }));
  }, [walletTransactionsInRange, walletAccount, analyticsBounds]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const t of walletTransactionsInRange) {
      if (t.type === 'expense' && t.accountId === walletAccount?.id) {
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
  }, [walletTransactionsInRange, walletAccount]);

  const budgetSpentPercent = Math.min(100, (stats.currentRangeExpenses / (budget.monthlyLimit || 1)) * 100);
  const dailyStats = useMemo(() => {
    const now = new Date();
    const selectedDate = new Date(now);
    selectedDate.setDate(now.getDate() - selectedDayOffset);

    const dailyExpenseTransactions = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const d = parseLocalDate(t.date);
      return (
        t.accountId === walletAccount?.id &&
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });

    const todaySpent = dailyExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryMap: Record<string, number> = {};
    for (const tx of dailyExpenseTransactions) {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    }
    const whereEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { todaySpent, selectedDate, whereEntries };
  }, [transactions, walletAccount, selectedDayOffset]);

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
        <StatCard label={`${analyticsBounds.label} Income`} value={stats.currentRangeIncome} type="income" currency={currency} />
        <StatCard label={`${analyticsBounds.label} Expenses`} value={stats.currentRangeExpenses} type="expense" currency={currency} />
      </section>

      <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-brand border border-slate-100 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: 'thisMonth', label: 'This Month' },
            { id: 'lastMonth', label: 'Last Month' },
            { id: 'custom', label: 'Custom' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setAnalyticsRange(option.id as AnalyticsRange)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                analyticsRange === option.id ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {analyticsRange === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        )}
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
                {formatCurrency(stats.totalBalance, currency)} Left in Wallet
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-brand border border-slate-100">
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

            <p className="text-xs text-brand-muted">
              {dailyStats.selectedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="mt-2 space-y-1">
              {dailyStats.whereEntries.length === 0 && (
                <p className="text-xs text-brand-muted">Where: no expenses</p>
              )}
              {dailyStats.whereEntries.map(([cat, amount]) => (
                <p key={cat} className="text-xs text-brand-muted">
                  {cat}: {formatCurrency(amount, currency)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-brand border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
          <div>
            <h3 className="font-bold text-lg">Spending Trend</h3>
            <p className="text-xs text-brand-muted">Expenses for {analyticsBounds.label.toLowerCase()}</p>
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
          <h3 className="font-bold mb-6">Spending by Category ({analyticsBounds.label})</h3>
          <div className="flex flex-col gap-5">
            {categoryTotals.categoryEntries.length === 0 && (
              <p className="text-sm text-brand-muted">No expense categories in selected range.</p>
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
