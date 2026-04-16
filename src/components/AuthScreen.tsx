import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Fingerprint, Eye, EyeOff } from 'lucide-react';
import {
  setupPIN,
  verifyPIN,
  isPINSetup,
  authenticateWithBiometric,
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  setAuthToken,
} from '../lib/auth';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'setup' | 'login' | 'biometric'>('setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if PIN is already setup
    if (isPINSetup()) {
      setMode('login');
      // Check biometric availability
      isBiometricAvailable().then(setBiometricAvailable);
      if (isBiometricEnabled()) {
        setMode('biometric');
      }
    }

    // Try biometric on mount if enabled
    if (isBiometricEnabled()) {
      attemptBiometric();
    }
  }, []);

  const attemptBiometric = async () => {
    setLoading(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        setAuthToken();
        onAuthenticated();
      } else {
        setMode('login');
        setError('Biometric failed. Please use PIN.');
      }
    } catch (err) {
      setMode('login');
      setError('Biometric not available');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (pin.length < 4) {
        throw new Error('PIN must be at least 4 digits');
      }
      if (pin !== confirmPin) {
        throw new Error('PINs do not match');
      }

      await setupPIN(pin);
      setAuthToken();

      // Check if biometric is available
      const bioAvailable = await isBiometricAvailable();
      if (bioAvailable) {
        enableBiometric();
        setBiometricAvailable(true);
        setMode('biometric');
      } else {
        onAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const valid = await verifyPIN(pin);
      if (!valid) {
        throw new Error('Invalid PIN');
      }

      setAuthToken();
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'biometric' && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <Fingerprint className="w-16 h-16 mx-auto text-blue-500" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Biometric Authentication</h1>
          <p className="text-gray-600 mb-8">Scan your fingerprint to access</p>

          <button
            onClick={attemptBiometric}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg mb-4 disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Start Scan'}
          </button>

          <button
            onClick={() => setMode('login')}
            className="w-full text-blue-500 hover:text-blue-600 font-semibold py-2"
          >
            Use PIN Instead
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mt-4"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full"
        >
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-blue-500" />
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Setup PIN</h1>
          <p className="text-center text-gray-600 mb-6">Create a 4-digit PIN to secure your app</p>

          <form onSubmit={handleSetupPIN} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Enter PIN</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Confirm PIN</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4 || confirmPin.length < 4}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full"
      >
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-blue-500" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Unlock App</h1>
        <p className="text-center text-gray-600 mb-6">Enter your 4-digit PIN</p>

        <form onSubmit={handleLoginPIN} className="space-y-4">
          <div>
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 6))}
              placeholder="••••"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-3xl tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-16 text-gray-500"
            >
              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        {biometricAvailable && (
          <button
            onClick={() => setMode('biometric')}
            className="w-full mt-4 flex items-center justify-center gap-2 text-blue-500 hover:text-blue-600 font-semibold py-2"
          >
            <Fingerprint size={20} />
            Use Fingerprint
          </button>
        )}
      </motion.div>
    </div>
  );
}
