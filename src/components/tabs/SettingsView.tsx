import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface SettingsViewProps {
  onClearData: () => void;
}

export default function SettingsView({ onClearData }: SettingsViewProps) {
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
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold">MAD</div>
            <p className="text-xs text-brand-muted mt-2">Currency is fixed to MAD by default.</p>
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
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">App Version</p>
            <p className="text-sm font-semibold text-brand-text">v20260418-4</p>
          </div>
          <button
            onClick={onClearData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-colors"
          >
            <Trash2 size={18} />
            Clear data and start fresh
          </button>
          <p className="text-xs text-brand-muted text-center">This action resets the app to a clean state.</p>
        </div>
      </div>
    </motion.div>
  );
}
