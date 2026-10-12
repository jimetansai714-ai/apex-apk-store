import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Copyright, 
  Lock, 
  Code, 
  MessageSquare, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { Language } from '../types';
import { POLICIES, PolicyType } from '../data/policyContent';

interface Props {
  isOpen: boolean;
  initialTab?: PolicyType;
  onClose: () => void;
  language: Language;
}

export const PolicyModal: React.FC<Props> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialTab);

  // Sync if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const currentDoc = POLICIES[activeTab] || POLICIES.privacy;

  const TABS: { id: PolicyType; labelEn: string; labelMy: string; icon: any }[] = [
    { id: 'privacy', labelEn: 'Privacy Policy', labelMy: 'ကိုယ်ရေးကိုယ်တာ', icon: Lock },
    { id: 'terms', labelEn: 'Terms of Service', labelMy: 'ဝန်ဆောင်မှု စည်းမျဉ်း', icon: FileText },
    { id: 'dmca', labelEn: 'DMCA Copyright', labelMy: 'မူပိုင်ခွင့် မူဝါဒ', icon: Copyright },
    { id: 'security', labelEn: 'Security & Integrity', labelMy: 'APK လုံခြုံရေး', icon: ShieldCheck },
    { id: 'developer', labelEn: 'Developer Guide', labelMy: 'ဆော့ဖ်ဝဲလ် တင်သွင်းမှု', icon: Code },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'P-Store နိုင်ငံတကာ စည်းမျဉ်းနှင့် မူဝါဒများ' : 'P-Store Trust, Safety & Legal Center'}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {language === 'my' ? `နောက်ဆုံး မွမ်းမံထားမှု: ${currentDoc.lastUpdated}` : `Last Updated: ${currentDoc.lastUpdated}`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 text-xs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={13} />
                <span>{language === 'my' ? tab.labelMy : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-2">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {language === 'my' ? currentDoc.titleMy : currentDoc.titleEn}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              P-Store Global Software Distribution Compliance
            </p>
          </div>

          <div className="space-y-6">
            {currentDoc.sections.map((sec, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{language === 'my' ? sec.headingMy : sec.headingEn}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'my' ? sec.contentMy : sec.contentEn}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Contact Box for any policy question */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300">
                {language === 'my' ? 'မူဝါဒနှင့် ပတ်သက်၍ သိရှိလိုပါက မေးမြန်းနိုင်ပါသည်' : 'Have questions regarding this policy?'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Official Desk: jimetansai714@gmail.com | Telegram/WhatsApp: +959977500588
              </p>
            </div>
            <a
              href="mailto:jimetansai714@gmail.com"
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
            >
              Contact Legal
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>P-Store Trust & Safety Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            {language === 'my' ? 'ပိတ်မည်' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
