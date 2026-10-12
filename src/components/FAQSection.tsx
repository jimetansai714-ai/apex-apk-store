import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Download, Smartphone, Mail } from 'lucide-react';
import { Language } from '../types';

interface Props {
  language: Language;
  onOpenContact: () => void;
  onOpenPolicy: (tab: any) => void;
}

export const FAQSection: React.FC<Props> = ({ language, onOpenContact, onOpenPolicy }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const FAQS = [
    {
      qEn: 'Are APK files on P-Store 100% safe to install?',
      qMy: 'P-Store မှ ဒေါင်းလုဒ်ရယူသော APK များသည် ၁၀၀% လုံခြုံစိတ်ချရပါသလား?',
      aEn: 'Yes. Every APK binary is verified against genuine developer cryptographic signatures and scanned through multi-engine malware detection. Checksums (SHA-256) are publicly provided on every app page for complete transparency.',
      aMy: 'လုံးဝ လုံခြုံစိတ်ချရပါသည်။ ဖိုင်တိုင်းကို မူရင်း Developer လက်မှတ်များဖြင့် စစ်ဆေးထားပြီး ဗိုင်းရပ်စ်နှင့် မသမာသော ကုတ်များ မပါဝင်ကြောင်း အဆင့်ဆင့် စစ်ဆေးထားပါသည်။ ဖိုင်တိုင်းတွင် SHA-256 Hash ကုဒ်ကို ပွင့်လင်းမြင်သာစွာ ဖော်ပြပေးထားပါသည်။',
    },
    {
      qEn: 'How do I install an APK file on my Android device?',
      qMy: 'ဒေါင်းလုဒ်ရရှိသော APK ဖိုင်ကို Android ဖုန်းထဲတွင် မည်သို့ Install လုပ်ရပါသနည်း?',
      aEn: '1) Download the APK; 2) When prompted by Android, enable "Install unknown apps" in Settings for your browser or file manager; 3) Tap the downloaded file and select "Install". Your app is ready in seconds.',
      aMy: '၁) APK ကို ဒေါင်းလုဒ်ဆွဲပါ၊ ၂) ဖုန်း Settings ထဲတွင် "Install unknown apps" ခွင့်ပြုချက် ပေးပါ၊ ၃) ဖိုင်ကို နှိပ်ပြီး "Install" လုပ်လိုက်ရုံဖြင့် စက္ကန့်ပိုင်းအတွင်း အသုံးပြုနိုင်ပါပြီ။',
    },
    {
      qEn: 'How can developers submit new Android applications?',
      qMy: 'Developer များအနေဖြင့် မိမိတို့၏ အက်ပ်များကို မည်သို့ တင်သွင်းနိုင်ပါသနည်း?',
      aEn: 'Developers can use the Admin Portal (with authorized passcode) or reach out directly to our engineering desk via jimetansai714@gmail.com or Telegram/WhatsApp (+959977500588) for automated pipeline publishing.',
      aMy: 'စီမံခန့်ခွဲသူ Passcode ဖြင့် Admin Panel မှတစ်ဆင့် တိုက်ရိုက် တင်သွင်းနိုင်သလို၊ jimetansai714@gmail.com သို့မဟုတ် Telegram/WhatsApp (+959977500588) သို့ ဆက်သွယ်၍လည်း အခမဲ့ တင်သွင်းနိုင်ပါသည်။',
    },
    {
      qEn: 'How do I submit a DMCA Copyright Takedown request?',
      qMy: 'မူပိုင်ခွင့် ချိုးဖောက်မှု (DMCA) တိုင်ကြားချက်များကို မည်သို့ ပေးပို့ရမည်နည်း?',
      aEn: 'We strictly respect intellectual property. Email jimetansai714@gmail.com with subject "DMCA Notice", identifying the infringing package. Valid requests are removed within 24 hours under our DMCA Compliance Policy.',
      aMy: 'မူပိုင်ခွင့်ကို အပြည့်အဝ လေးစားပါသည်။ jimetansai714@gmail.com သို့ အကြောင်းကြားလွှာ ပေးပို့နိုင်ပြီး ၂၄ နာရီအတွင်း စစ်ဆေး၍ ဖယ်ရှားပေးပါမည်။',
    },
  ];

  return (
    <section className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle size={20} className="text-emerald-500" />
            <span>{language === 'my' ? 'မကြာခဏ မေးလေ့ရှိသော မေးခွန်းများ (FAQ)' : 'Frequently Asked Questions'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'my' ? 'လုံခြုံရေး၊ အသုံးပြုနည်းနှင့် မူဝါဒဆိုင်ရာ အမေးအဖြေများ' : 'Security, installation, and platform integrity information'}
          </p>
        </div>

        <button
          onClick={onOpenContact}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          {language === 'my' ? 'အခြားမေးမြန်းရန် →' : 'Ask Question →'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {language === 'my' ? faq.qMy : faq.qEn}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : ''}`}
                />
              </button>

              {isOpen && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 leading-relaxed animate-in fade-in">
                  {language === 'my' ? faq.aMy : faq.aEn}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
