import { useState } from 'react';
import { motion } from 'motion/react';
import { Account, Category, Currency, Transaction, TransactionType } from '../types.ts';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (t: Transaction) => void;
  editingTransaction: Transaction | null;
  accounts: Account[];
  currency: Currency;
}

export default function AddTransactionModal({ onClose, onAdd, onUpdate, editingTransaction, accounts, currency }: AddTransactionModalProps) {
  const isEditing = Boolean(editingTransaction);
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || 'expense');
  const [category, setCategory] = useState<Category>(editingTransaction?.category || 'Food');
  const [amount, setAmount] = useState<number>(editingTransaction?.amount ?? 0);
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(editingTransaction?.accountId || '');
  const [toAccountId, setToAccountId] = useState(editingTransaction?.toAccountId || '');
  const [formError, setFormError] = useState('');

  const hasValidAmount = Number.isFinite(amount) && amount > 0;
  const hasDescription = description.trim().length > 0;
  const hasAnyAccounts = accounts.length > 0;
  const hasEnoughAccountsForTransfer = type !== 'transfer' || accounts.length > 1;
  const hasFromAccount = accountId.trim().length > 0;
  const hasToAccount = type !== 'transfer' || toAccountId.trim().length > 0;
  const hasDistinctAccounts = type !== 'transfer' || accountId !== toAccountId;
  const canSubmit =
    hasValidAmount &&
    hasDescription &&
    hasAnyAccounts &&
    hasEnoughAccountsForTransfer &&
    hasFromAccount &&
    hasToAccount &&
    hasDistinctAccounts;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[92dvh] overflow-y-auto"
      >
        <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            X
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {[
              { id: 'expense', label: 'Expense', color: 'text-brand-danger' },
              { id: 'income', label: 'Income', color: 'text-brand-success' },
              { id: 'transfer', label: 'Transfer', color: 'text-brand-blue' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setFormError('');
                  setType(t.id as TransactionType);
                  if (t.id === 'income') setCategory('Income');
                  else if (t.id === 'transfer') {
                    setCategory('Transfer');
                    if (!editingTransaction) {
                      setAccountId('');
                      setToAccountId('');
                    }
                  } else if (category === 'Income' || category === 'Transfer') {
                    setCategory('Food');
                  }
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
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    setFormError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
                >
                  <option value="" disabled>
                    Select account
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {type === 'transfer' && (
                <div>
                  <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">To Account</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => {
                      setToAccountId(e.target.value);
                      setFormError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none"
                  >
                    <option value="" disabled>
                      Select account
                    </option>
                    {accounts
                      .filter((acc) => acc.id !== accountId)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">Amount ({currency})</label>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => {
                    setAmount(Number(e.target.value));
                    setFormError('');
                  }}
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
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFormError('');
                }}
                placeholder={type === 'transfer' ? 'Transfer description' : 'What was this for?'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase block mb-2 tracking-widest">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setFormError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-brand-danger font-semibold">{formError}</p>}

          <button
            onClick={() => {
              if (!hasValidAmount) {
                setFormError('Amount must be greater than 0.');
                return;
              }
              if (!hasAnyAccounts) {
                setFormError('Create an account first.');
                return;
              }
              if (!hasEnoughAccountsForTransfer) {
                setFormError('Create at least two accounts for transfer.');
                return;
              }
              if (!hasDescription) {
                setFormError('Description is required.');
                return;
              }
              if (!hasFromAccount) {
                setFormError(type === 'transfer' ? 'Please choose a From account.' : 'Please choose an account.');
                return;
              }
              if (!hasToAccount) {
                setFormError('Please choose a To account.');
                return;
              }
              if (!hasDistinctAccounts) {
                setFormError('From and To accounts must be different.');
                return;
              }

              const payload = {
                amount,
                type,
                category,
                date,
                description,
                accountId,
                toAccountId: type === 'transfer' ? toAccountId : undefined,
              };

              if (editingTransaction) {
                onUpdate({
                  ...editingTransaction,
                  ...payload,
                });
              } else {
                onAdd(payload);
              }

              onClose();
            }}
            disabled={!canSubmit}
            className="w-full bg-brand-blue text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save Changes' : type === 'transfer' ? 'Confirm Transfer' : 'Add Transaction'}
          </button>

          {!canSubmit && (
            <p className="text-xs text-brand-muted">
              {!hasAnyAccounts
                ? 'Create an account first.'
                : !hasEnoughAccountsForTransfer
                  ? 'Transfer needs at least two accounts.'
                  : 'Fill all required fields to enable this button.'}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
