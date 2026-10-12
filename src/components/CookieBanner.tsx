import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Language } from '../types';

interface Props {
  language: Language;
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<Props> = ({ language, onOpenPrivacy }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('apexapk_cookie_consent');
      if (!accepted) {
        setShow(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('apexapk_cookie_consent', 'accepted');
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 text-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-white">
            {language === 'my' ? 'ကိုယ်ရေးကိုယ်တာနှင့် ကွတ်ကီး မူဝါဒ' : 'Privacy & Essential Cookies'}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            {language === 'my'
              ? 'P-Store သည် အက်ပ်များကို မြန်ဆန်စွာ ဒေါင်းလုဒ်ဆွဲနိုင်စေရန် မရှိမဖြစ် ကွတ်ကီးများကိုသာ သုံးစွဲပါသည်။ ကိုယ်ရေးအချက်အလက် ခြေရာခံခြင်း လုံးဝ မရှိပါ။'
              : 'P-Store uses essential local caching to ensure high-speed downloads and secure checksum validation. We never track or sell your personal data.'}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              {language === 'my' ? 'လက်ခံသည်' : 'Accept & Continue'}
            </button>
            <button
              onClick={onOpenPrivacy}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
            >
              {language === 'my' ? 'မူဝါဒ အပြည့်အစုံဖတ်ရန်' : 'Read Policy'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShow(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
