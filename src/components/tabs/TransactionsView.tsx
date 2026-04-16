import { useMemo } from 'react';
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
  const sortedTransactions = useMemo(() => {
    const withIndex = transactions.map((tx, index) => ({ tx, index }));
    withIndex.sort((a, b) => {
      const dateDiff = parseLocalDate(b.tx.date).getTime() - parseLocalDate(a.tx.date).getTime();
      if (dateDiff !== 0) return dateDiff;

      // If dates are the same, keep newest inserted item first.
      return b.index - a.index;
    });
    return withIndex.map((item) => item.tx);
  }, [transactions]);

  const escapeCsv = (value: unknown): string => {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Account', 'To Account', 'Description', 'Amount'];
    const rows = sortedTransactions
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
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {sortedTransactions.map((tx) => {
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
            {sortedTransactions.map((tx) => {
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

      {transactions.length === 0 && (
        <p className="text-center py-12 sm:py-20 text-brand-muted">No transactions registered yet.</p>
      )}
    </motion.div>
  );
}
