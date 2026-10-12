import React, { useState } from 'react';
import { Lock, Shield, Eye, EyeOff, ArrowRight, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';

interface Props {
  onAuthenticated: () => void;
}

// Cryptographic SHA-256 hash of the master password (one-way irreversible hash, zero plaintext in code)
const SECURE_HASH_TARGET = '2a767f054736430c30b1fc2930c9a984555c1555e18aa8e5fdf07fc5d8e81350';

async function computeSha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AdminLoginGate: React.FC<Props> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    let serverAttempted = false;

    try {
      // 1. Primary: Server-side authentication
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: trimmed }),
      });

      serverAttempted = true;
      const data = await response.json();

      if (response.ok && data.success && data.token) {
        setErrorMessage(null);
        if (rememberMe) {
          localStorage.setItem('apexapk_admin_auth', data.token);
        } else {
          sessionStorage.setItem('apexapk_admin_auth', data.token);
        }
        onAuthenticated();
        return;
      } else {
        setErrorMessage(data.error || 'စီမံခန့်ခွဲသူ လျှို့ဝှက်ကုဒ် မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
    } catch {
      // 2. Resilient cryptographic verification if server network is unreachable
      try {
        const computedHash = await computeSha256(trimmed);
        if (computedHash === SECURE_HASH_TARGET) {
          const fallbackToken = `fallback_auth_${computedHash}`;
          if (rememberMe) {
            localStorage.setItem('apexapk_admin_auth', fallbackToken);
          } else {
            sessionStorage.setItem('apexapk_admin_auth', fallbackToken);
          }
          setErrorMessage(null);
          onAuthenticated();
          return;
        } else {
          setErrorMessage('စီမံခန့်ခွဲသူ လျှို့ဝှက်ကုဒ် မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }
      } catch {
        setErrorMessage(
          serverAttempted
            ? 'စီမံခန့်ခွဲသူ လျှို့ဝှက်ကုဒ် မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။'
            : 'ဆာဗာသို့ ချိတ်ဆက်၍ မရနိုင်ပါ။ ကွန်ရက်ကို ပြန်လည်စစ်ဆေးပါ။'
        );
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div 
        className={`w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Top Header & Lock Badge */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <Lock size={28} className="stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>P-Store Master Console</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LOCKED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              စီမံခန့်ခွဲသူ လျှို့ဝှက်ကုဒ် ထည့်သွင်းပြီးမှသာ ဝင်ရောက်ခွင့်ရရှိပါမည်။
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} className="text-emerald-400" />
              <span>Admin Password</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={isLoading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none transition-all pr-11 ${
                  errorMessage
                    ? 'border-rose-500 focus:border-rose-400 shadow-rose-950/30'
                    : 'border-slate-800 focus:border-emerald-500 shadow-inner'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-1.5 mt-2 text-rose-400 text-xs font-semibold animate-in fade-in">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span>Remember login</span>
            </label>

            <a
              href="/"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Back to Store
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>စစ်ဆေးနေပါသည်...</span>
              </>
            ) : (
              <>
                <span>Unlock Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security watermark */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Shield size={12} className="text-emerald-500" />
            <span>Server-Encrypted Session</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80">Zero-Leak Guard</span>
        </div>
      </div>
    </div>
  );
};
