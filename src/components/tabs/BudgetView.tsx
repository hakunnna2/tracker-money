import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Budget, Currency } from '../../types.ts';
import { formatCurrency } from '../../lib/currency.ts';

interface BudgetViewProps {
  budget: Budget;
  onSave: (b: Budget) => void;
  onReset: () => void;
  currency: Currency;
}

export default function BudgetView({ budget, onSave, onReset, currency }: BudgetViewProps) {
  const [valInput, setValInput] = useState(String(budget.monthlyLimit));
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const parsedVal = Number(valInput);
  const isValidNumber = valInput.trim() !== '' && Number.isFinite(parsedVal);

  useEffect(() => {
    setValInput(String(budget.monthlyLimit));
  }, [budget.monthlyLimit]);

  useEffect(() => {
    if (saveState !== 'saved') return;

    const timer = window.setTimeout(() => setSaveState('idle'), 1500);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const hasChanges = isValidNumber && parsedVal !== budget.monthlyLimit;

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
          <input
            type="number"
            value={valInput}
            onChange={(e) => setValInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
          <p className="text-[11px] text-brand-muted mt-2">
            Current: {formatCurrency(isValidNumber ? parsedVal : 0, currency)}
          </p>
        </div>
        <p className="text-xs text-brand-muted leading-relaxed">
          Set a realistic monthly limit to keep track of your spending and compare it with your real monthly transactions.
        </p>
        <button
          onClick={() => {
            if (!isValidNumber) {
              return;
            }

            onSave({ monthlyLimit: parsedVal });
            setSaveState('saved');
          }}
          disabled={!hasChanges || !isValidNumber}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveState === 'saved' ? 'Saved' : 'Save Budget'}
        </button>
        <p className="text-xs text-brand-muted -mt-3">
          {hasChanges ? 'Unsaved changes' : 'Budget is up to date'}
        </p>
        <button
          onClick={() => {
            setValInput('2000');
            onReset();
            setSaveState('saved');
          }}
          className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Reset Budget
        </button>
      </div>
    </motion.div>
  );
}
