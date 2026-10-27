import React, { useState } from 'react';
import { X, Lock, Shield, User, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLoginSuccess: (user: { username: string; role: string; name: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLoginSuccess,
}) => {
  const t = translations[lang];

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundManager.playClickSound();

    try {
      const res = await loginAdmin(username, password);
      if (res.success && res.user) {
        soundManager.playStartSound();
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (u: string, p: string) => {
    soundManager.playClickSound();
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {lang === 'sw' ? 'Kuingia kwa Admin / Operator' : 'Staff & Admin Login'}
              </h3>
              <p className="text-xs text-slate-400">PlayStation Lounge Control Panel</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {lang === 'sw' ? 'Jina la Mtumiaji (Username)' : 'Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm pl-10 focus:outline-none focus:border-indigo-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {lang === 'sw' ? 'Nenosiri (Password)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm pl-10 focus:outline-none focus:border-indigo-500"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Quick preset credentials */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400">
              {lang === 'sw' ? 'Akaunti za Majaribio (Click to autofill):' : 'Demo Credentials (Click to fill):'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillQuick('admin', 'admin123')}
                className="flex-1 py-1 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800 text-[11px] font-bold text-indigo-300 transition-colors"
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('operator', 'operator123')}
                className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 transition-colors"
              >
                Operator (Station Desk)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{t.login}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
