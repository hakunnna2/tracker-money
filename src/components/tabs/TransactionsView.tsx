import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, ChevronRight, Download, Pencil } from 'lucide-react';
import { Account, Currency, Transaction } from '../../types.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { parseLocalDate } from '../../lib/date.ts';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  accounts: Account[];
  currency: Currency;
}

export default function TransactionsView({
  transactions,
  onDelete,
  onEdit,
  accounts,
  currency,
}: TransactionsViewProps) {
  const [searchText, setSearchText] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minAmountInput, setMinAmountInput] = useState('');
  const [maxAmountInput, setMaxAmountInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.category))).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const minAmount = minAmountInput.trim() === '' ? null : Number(minAmountInput);
    const maxAmount = maxAmountInput.trim() === '' ? null : Number(maxAmountInput);

    const filtered = transactions.filter((tx) => {
      if (accountFilter !== 'all') {
        const matchesPrimary = tx.accountId === accountFilter;
        const matchesTransferTarget = tx.type === 'transfer' && tx.toAccountId === accountFilter;
        if (!matchesPrimary && !matchesTransferTarget) return false;
      }

      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      if (normalizedSearch && !tx.description.toLowerCase().includes(normalizedSearch)) return false;

      if (minAmount !== null && Number.isFinite(minAmount) && tx.amount < minAmount) return false;
      if (maxAmount !== null && Number.isFinite(maxAmount) && tx.amount > maxAmount) return false;

      const txTime = parseLocalDate(tx.date).getTime();
      if (startDate) {
        const startTime = parseLocalDate(startDate).getTime();
        if (txTime < startTime) return false;
      }
      if (endDate) {
        const end = parseLocalDate(endDate);
        end.setHours(23, 59, 59, 999);
        if (txTime > end.getTime()) return false;
      }

      return true;
    });

    const withIndex = transactions.map((tx, index) => ({ tx, index }));
    const indexMap = new Map(withIndex.map((item) => [item.tx.id, item.index]));
    const sortable = filtered.map((tx) => ({ tx, index: indexMap.get(tx.id) ?? 0 }));
    sortable.sort((a, b) => {
      const dateDiff = parseLocalDate(b.tx.date).getTime() - parseLocalDate(a.tx.date).getTime();
      if (dateDiff !== 0) return dateDiff;

      // If dates are the same, keep newest inserted item first.
      return b.index - a.index;
    });
    return sortable.map((item) => item.tx);
  }, [transactions, searchText, accountFilter, categoryFilter, minAmountInput, maxAmountInput, startDate, endDate]);

  const escapeCsv = (value: unknown): string => {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Account', 'To Account', 'Description', 'Amount'];
    const rows = filteredTransactions
      .map((tx) => {
        const account = accounts.find((a) => a.id === tx.accountId);
        const toAccount = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
        return [
          escapeCsv(parseLocalDate(tx.date).toLocaleDateString()),
          escapeCsv(tx.type),
          escapeCsv(tx.category),
          escapeCsv(account?.name || 'Unknown'),
          escapeCsv(toAccount?.name || ''),
          escapeCsv(tx.description),
          tx.type === 'expense' ? -tx.amount : tx.amount,
        ];
      });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

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
      className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-brand border border-slate-100 flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-lg sm:text-xl font-bold">All Transactions</h2>
        <button
          onClick={exportToCSV}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search description"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
        >
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
        >
          <option value="all">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setSearchText('');
            setAccountFilter('all');
            setCategoryFilter('all');
            setMinAmountInput('');
            setMaxAmountInput('');
            setStartDate('');
            setEndDate('');
          }}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="number"
          value={minAmountInput}
          onChange={(e) => setMinAmountInput(e.target.value)}
          placeholder="Min amount"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <input
          type="number"
          value={maxAmountInput}
          onChange={(e) => setMaxAmountInput(e.target.value)}
          placeholder="Max amount"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      <p className="text-xs text-brand-muted mb-4">Showing {filteredTransactions.length} of {transactions.length} transactions</p>

      <div className="md:hidden flex flex-col gap-3">
        {filteredTransactions.map((tx) => {
            const account = accounts.find((a) => a.id === tx.accountId);
            const toAccount = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
            return (
              <div key={tx.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-brand-muted font-semibold">{parseLocalDate(tx.date).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{tx.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onEdit(tx)}
                      className="text-slate-300 hover:text-brand-blue transition-colors cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="text-slate-300 hover:text-brand-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {tx.category}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold truncate">
                    {tx.type === 'transfer'
                      ? `${account?.name || 'Unknown'} -> ${toAccount?.name || 'Unknown'}`
                      : (account?.name || 'Unknown')}
                  </span>
                </div>

                <p
                  className={`mt-3 text-base font-bold ${tx.type === 'income' ? 'text-brand-success' : tx.type === 'expense' ? 'text-brand-danger' : 'text-brand-blue'}`}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatCurrency(tx.amount, currency)}
                </p>
              </div>
            );
            })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left min-w-[760px]">
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
            {filteredTransactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId);
                return (
                  <tr key={tx.id} className="text-sm">
                    <td className="py-5 font-medium">{parseLocalDate(tx.date).toLocaleDateString()}</td>
                    <td className="py-5">
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-5 text-slate-500 font-medium">
                      {tx.type === 'transfer' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[80px]">{account?.name}</span>
                          <ChevronRight size={12} className="text-slate-300" />
                          <span className="truncate max-w-[80px]">{accounts.find((a) => a.id === tx.toAccountId)?.name}</span>
                        </div>
                      ) : (
                        account?.name || 'Unknown'
                      )}
                    </td>
                    <td className="py-5 text-slate-600 max-w-[200px] truncate">{tx.description}</td>
                    <td
                      className={`py-5 font-bold text-right ${tx.type === 'income' ? 'text-brand-success' : tx.type === 'expense' ? 'text-brand-danger' : 'text-brand-blue'}`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(tx)}
                          className="text-slate-300 hover:text-brand-blue transition-colors cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(tx.id)}
                          className="text-slate-300 hover:text-brand-danger transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <p className="text-center py-12 sm:py-20 text-brand-muted">No transactions match the current filters.</p>
      )}
    </motion.div>
  );
}
