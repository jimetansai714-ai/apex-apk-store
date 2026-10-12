import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { PStoreLogo } from './PStoreLogo';

interface Props {
  language: Language;
}

export const PwaInstallBanner: React.FC<Props> = ({ language }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem('pstore_install_dismissed'));
    } catch {
      return false;
    }
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const [showManualTip, setShowManualTip] = useState(false);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowManualTip(true);
      setTimeout(() => setShowManualTip(false), 6000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pstore_install_dismissed', 'true');
    } catch {}
  };

  if (isDismissed || isInstalled) return null;

  return (
    <div className="relative z-30 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <PStoreLogo size="sm" showText={false} />
          <div>
            <p className="font-bold flex items-center gap-1.5 text-slate-100">
              <Sparkles size={14} className="text-emerald-400" />
              <span>{language === 'my' ? 'P-Store ကို သင့်ဖုန်းတွင် App အဖြစ် သွင်းယူပါ' : 'Install P-Store on your Phone'}</span>
            </p>
            <p className="text-[11px] text-slate-300">
              {language === 'my' 
                ? 'App Store ကဲ့သို့ ပိုမိုမြန်ဆန်စွာ အသုံးပြုနိုင်ရန် Home Screen တွင် ထားရှိပါ' 
                : 'Add to home screen for 1-tap instant APK access & updates'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end relative">
          {showManualTip && (
            <div className="absolute bottom-full right-0 mb-2 p-2.5 bg-slate-900 text-slate-100 rounded-xl border border-emerald-500/40 text-[11px] shadow-2xl max-w-xs z-50 animate-in fade-in slide-in-from-bottom-2">
              <p className="font-semibold text-emerald-400 mb-1">
                {language === 'my' ? '📌 ဖုန်းတွင် သွင်းယူနည်း:' : '📌 How to install:'}
              </p>
              <p className="text-slate-300 leading-relaxed">
                {language === 'my'
                  ? 'သင့် Browser ရဲ့ Menu (⋮) ကို နှိပ်ပြီး "Add to Home screen" သို့မဟုတ် "Install App" ကို ရွေးချယ်ပေးပါခင်ဗျာ။'
                  : 'Tap your browser menu (⋮) and select "Add to Home screen" or "Install App".'}
              </p>
            </div>
          )}
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Download size={13} className="stroke-[2.5]" />
            <span>{language === 'my' ? 'ဖုန်းတွင် သွင်းယူမည်' : 'Install App'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
