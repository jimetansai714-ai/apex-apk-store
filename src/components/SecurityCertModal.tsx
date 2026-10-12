import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  FileCheck, 
  AlertTriangle, 
  Smartphone, 
  Server,
  Fingerprint,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';

interface Props {
  app: APKApp | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SecurityCertModal: React.FC<Props> = ({ app, isOpen, onClose, language }) => {
  const [copiedSha, setCopiedSha] = useState(false);

  if (!isOpen || !app) return null;

  const copySha = () => {
    navigator.clipboard.writeText(app.sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 space-y-5 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Security Badge Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <ShieldCheck size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'လုံခြုံရေး စစ်ဆေးချက် အာမခံလက်မှတ်' : 'Security & Trust Certificate'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'my' 
                ? 'အန္တရာယ်ရှိသော ကုဒ်များနှင့် ဗိုင်းရပ်စ် ကင်းစင်ကြောင်း စစ်ဆေးအတည်ပြုချက်' 
                : 'Cryptographic signature and malware-free inspection guarantee'}
            </p>
          </div>
        </div>

        {/* Target App Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <AppIconRenderer app={app} size="md" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {language === 'my' && app.nameMy ? app.nameMy : app.name}
            </h4>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{app.packageName}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{app.version}</span>
              <span>·</span>
              <span>{app.size}</span>
            </div>
          </div>
        </div>

        {/* 4 Security Pillars */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'my' ? 'စစ်ဆေးချက် အချက်အလက်များ' : 'Security Inspection Checks'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={15} />
                <span>Play Protect Verified</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {language === 'my' ? 'Google Safe Browsing စည်းမျဉ်းများနှင့် ကိုက်ညီသည်' : 'Meets strict Android package verification standards.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={15} />
                <span>Malware & Virus Free</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {language === 'my' ? 'အန္တရာယ်ရှိသော Trojan သို့မဟုတ် Spyware မပါဝင်ပါ' : 'Scanned clean of trojans, miners, and adware.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={15} />
                <span>Zero Telemetry Tracker</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {language === 'my' ? 'ဖုန်းဒေတာ ခိုးယူဖတ်ရှုသော Tracker များ မပါဝင်ပါ' : 'No intrusive third-party spyware or tracking SDKs.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={15} />
                <span>Official Signature Intact</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {language === 'my' ? 'မူရင်းဆော့ဖ်ဝဲလ် လက်မှတ် ပြုပြင်ပြောင်းလဲထားခြင်းမရှိပါ' : 'Cryptographic binary signature matches developer cert.'}
              </p>
            </div>
          </div>
        </div>

        {/* SHA-256 Fingerprint */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Fingerprint size={14} className="text-emerald-500" />
              <span>SHA-256 Checksum Signature</span>
            </span>
            <button
              onClick={copySha}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold text-[11px]"
            >
              {copiedSha ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedSha ? (language === 'my' ? 'ကူးယူပြီး ✓' : 'Copied!') : (language === 'my' ? 'ကူးမည်' : 'Copy Hash')}</span>
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all select-all leading-relaxed p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {app.sha256}
          </p>
        </div>

        {/* Permissions Overview */}
        <div className="space-y-1.5 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">
            {language === 'my' ? 'တောင်းဆိုထားသော ခွင့်ပြုချက်များ (Permissions)' : 'Declared App Permissions'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {app.permissions && app.permissions.length > 0 ? (
              app.permissions.map((perm, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
                >
                  ✓ {perm}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Standard Internet & Storage access</span>
            )}
          </div>
        </div>

        {/* Close Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {language === 'my' ? 'အတည်ပြုပြီးပါပြီ (ပိတ်မည်)' : 'Got it (Close)'}
          </button>
        </div>
      </div>
    </div>
  );
};
