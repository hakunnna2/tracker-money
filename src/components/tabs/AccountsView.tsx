import { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, PlusCircle, Pencil, Check, X, Trash2 } from 'lucide-react';
import { Account, Currency, Transaction } from '../../types.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { createId } from '../../lib/id.ts';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onAdd: (acc: Account) => void;
  onUpdate: (acc: Account) => void;
  onDelete: (id: string) => void;
  currency: Currency;
}

export default function AccountsView({
  accounts,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
  currency,
}: AccountsViewProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('Checking');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Account['type']>('Checking');
  const [editBalance, setEditBalance] = useState(0);
  const [formError, setFormError] = useState('');
  const [createFormError, setCreateFormError] = useState('');

  const getAccountTransactionDelta = (accountId: string) =>
    transactions.reduce((sum, t) => {
      if (t.accountId === accountId) {
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense' || t.type === 'transfer') return sum - t.amount;
      }
      if (t.type === 'transfer' && t.toAccountId === accountId) {
        return sum + t.amount;
      }
      return sum;
    }, 0);

  const trimmedCreateName = name.trim();
  const parsedInitialBalance = initialBalanceInput.trim() === '' ? 0 : Number(initialBalanceInput);
  const canCreateAccount = trimmedCreateName.length > 0 && Number.isFinite(parsedInitialBalance);

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setEditBalance(account.balance + getAccountTransactionDelta(account.id));
    setFormError('');
  };

  const saveEdit = (account: Account) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setFormError('Account name is required.');
      return;
    }

    if (!Number.isFinite(editBalance)) {
      setFormError('Balance must be a valid number.');
      return;
    }

    const transactionDelta = getAccountTransactionDelta(account.id);

    onUpdate({
      ...account,
      name: trimmedName,
      type: editType,
      // Keep history intact by converting desired current balance back to base balance.
      balance: editBalance - transactionDelta,
    });

    setEditingId(null);
    setFormError('');
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 pb-10">
      <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
        <h2 className="text-xl font-bold mb-2">My Bank Accounts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const balance = acc.balance + getAccountTransactionDelta(acc.id);

            return (
              <div
                key={acc.id}
                className="bg-white p-6 rounded-3xl shadow-brand border border-slate-100 flex flex-col justify-between group"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <Building2 size={20} />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => startEdit(acc)}
                      className="text-slate-300 hover:text-brand-blue transition-all cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(acc.id)}
                      className="text-slate-300 hover:text-brand-danger transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {editingId === acc.id ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as Account['type'])}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
                    >
                      <option>Checking</option>
                      <option>Credit Card</option>
                      <option>Cash</option>
                    </select>
                    <div>
                      <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1 tracking-wider">
                        Current Balance ({currency})
                      </label>
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      />
                    </div>
                    {formError && <p className="text-xs text-brand-danger font-semibold">{formError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(acc)}
                        className="flex-1 bg-brand-blue text-white py-2 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={14} />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setFormError('');
                        }}
                        className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-4">
                      <p className="text-xs font-bold text-brand-muted uppercase tracking-widest">{acc.type}</p>
                      <h4 className="font-bold text-lg mt-1">{acc.name}</h4>
                      <p className="text-xs text-brand-muted mt-1">Initial: {formatCurrency(acc.balance, currency)}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <p className="text-3xl font-bold">{formatCurrency(balance, currency)}</p>
                    </div>
                  </>
                )}
              </div>
            );
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
              onChange={(e) => {
                setName(e.target.value);
                setCreateFormError('');
              }}
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
              <option>Credit Card</option>
              <option>Cash</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5 tracking-wider">Initial Balance ({currency})</label>
            <input
              type="number"
              value={initialBalanceInput}
              onChange={(e) => {
                setInitialBalanceInput(e.target.value);
                setCreateFormError('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          {createFormError && <p className="text-xs text-brand-danger font-semibold">{createFormError}</p>}
          <button
            onClick={() => {
              if (!trimmedCreateName) {
                setCreateFormError('Account name is required.');
                return;
              }
              if (!Number.isFinite(parsedInitialBalance)) {
                setCreateFormError('Initial balance must be a valid number.');
                return;
              }
              onAdd({ id: createId(), name: trimmedCreateName, type, balance: parsedInitialBalance });
              setName('');
              setInitialBalanceInput('');
              setCreateFormError('');
            }}
            disabled={!canCreateAccount}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={18} />
            Create Account
          </button>
          {!canCreateAccount && (
            <p className="text-xs text-brand-muted">Enter account name and a valid initial balance to continue.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
