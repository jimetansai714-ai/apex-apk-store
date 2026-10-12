import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  Mail, 
  Phone, 
  Send, 
  MessageSquare, 
  Lock, 
  FileText, 
  Copyright, 
  Code, 
  ExternalLink,
  Heart
} from 'lucide-react';
import { Language } from '../types';
import { PolicyType } from '../data/policyContent';
import { PStoreLogo } from './PStoreLogo';

interface Props {
  language: Language;
  onOpenPolicy: (tab: PolicyType) => void;
  onOpenContact: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<Props> = ({ 
  language, 
  onOpenPolicy, 
  onOpenContact,
  onOpenAdmin,
}) => {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Safety Mission */}
          <div className="space-y-4">
            <PStoreLogo size="md" />

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'my' 
                ? 'နိုင်ငံတကာအဆင့်မီ မြန်ဆန်၍ လုံခြုံစိတ်ချရသော မြန်မာနှင့် ကမ္ဘာ့ Android APK များ တိုက်ရိုက်ဒေါင်းလုဒ် စင်တာ။' 
                : 'Next-generation Android application distribution portal. Direct high-speed CDN binaries, cryptographic checksums, and zero spyware.'}
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={16} />
                <span>P-Store Verified Clean</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                100% Original developer signatures verified before hosting.
              </p>
            </div>
          </div>

          {/* Column 2: Legal & Trust Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock size={13} className="text-emerald-500" />
              <span>{language === 'my' ? 'စည်းမျဉ်းနှင့် မူဝါဒများ' : 'Trust & Legal Center'}</span>
            </h3>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenPolicy('privacy')}
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <Lock size={12} />
                  <span>{language === 'my' ? 'ကိုယ်ရေးကိုယ်တာ မူဝါဒ (Privacy Policy)' : 'Privacy Policy'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('terms')}
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <FileText size={12} />
                  <span>{language === 'my' ? 'ဝန်ဆောင်မှု စည်းမျဉ်းများ (Terms of Service)' : 'Terms of Service'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('dmca')}
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <Copyright size={12} />
                  <span>{language === 'my' ? 'မူပိုင်ခွင့် တိုင်ကြားချက် (DMCA Takedown)' : 'DMCA Copyright Policy'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('security')}
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <ShieldCheck size={12} />
                  <span>{language === 'my' ? 'APK လုံခြုံရေး စစ်ဆေးမှု (Security Policy)' : 'APK Security & Safe Signing'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('developer')}
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <Code size={12} />
                  <span>{language === 'my' ? 'Developer တင်သွင်းမှု လမ်းညွှန်' : 'Developer Submission Guide'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Direct Official Channels */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Phone size={13} className="text-blue-500" />
              <span>{language === 'my' ? 'တရားဝင် ဆက်သွယ်ရန် လိုင်းများ' : 'Official Direct Channels'}</span>
            </h3>

            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="mailto:jimetansai714@gmail.com"
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Mail size={13} className="text-emerald-500 shrink-0" />
                  <span className="font-mono">jimetansai714@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/+959977500588"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-sky-500 transition-colors flex items-center gap-1.5"
                >
                  <Send size={13} className="text-sky-500 shrink-0" />
                  <span>Telegram (+959977500588)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/959977500588"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1.5"
                >
                  <Phone size={13} className="text-emerald-500 shrink-0" />
                  <span>WhatsApp (+959977500588)</span>
                </a>
              </li>
              <li>
                <a
                  href="viber://chat?number=%2B959977500588"
                  className="text-slate-600 dark:text-slate-400 hover:text-purple-500 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare size={13} className="text-purple-500 shrink-0" />
                  <span>Viber (+959977500588)</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+959977500588"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1.5"
                >
                  <Phone size={13} className="text-blue-500 shrink-0" />
                  <span className="font-mono font-semibold">+95 997 750 0588</span>
                </a>
              </li>
            </ul>

            <button
              onClick={onOpenContact}
              className="mt-2 w-full py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 transition-all cursor-pointer text-center"
            >
              {language === 'my' ? 'တိုက်ရိုက် စာပို့ရန် →' : 'Open Support Desk →'}
            </button>
          </div>

          {/* Column 4: Platform & Developer Inquiries */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Code size={13} className="text-cyan-500" />
              <span>{language === 'my' ? 'ဆော့ဖ်ဝဲလ် တင်သွင်းခြင်း' : 'Developer Submissions'}</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'my' 
                ? 'Developer များအနေဖြင့် မိမိတို့၏ Android ဆော့ဖ်ဝဲလ်များကို တင်သွင်းလိုပါက အထောက်အထားများနှင့်တကွ ကျွန်ုပ်တို့၏ Support Desk မှတစ်ဆင့် ဆက်သွယ်နိုင်ပါသည်။' 
                : 'Developers can submit original Android applications and updates for verified security testing and hosting.'}
            </p>

            <button
              onClick={onOpenContact}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-sm"
            >
              <Mail size={12} />
              <span>{language === 'my' ? 'Developer ဆက်သွယ်ရန်' : 'Submit via Support Desk'}</span>
            </button>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>• Microsoft Global CDN Delivery</p>
              <p>• Cryptographic SHA-256 Checksums</p>
              <p>• Automated Security Verification</p>
            </div>
          </div>

        </div>

        {/* Disclaimer & Bottom Copyright Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} P-Store. All trademarks, logos, and APK binaries are the property of their respective copyright owners.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => onOpenPolicy('privacy')}
              className="hover:underline cursor-pointer"
            >
              Privacy
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenPolicy('terms')}
              className="hover:underline cursor-pointer"
            >
              Terms
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenPolicy('dmca')}
              className="hover:underline cursor-pointer"
            >
              DMCA
            </button>
            <span>·</span>
            <button
              onClick={onOpenContact}
              className="hover:underline cursor-pointer font-bold text-emerald-600 dark:text-emerald-400"
            >
              Support
            </button>
            {onOpenAdmin && (
              <>
                <span>·</span>
                <button
                  onClick={onOpenAdmin}
                  className="hover:underline cursor-pointer text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 font-medium"
                  title="Open P-Store Master Admin Console"
                >
                  <Lock size={11} className="text-emerald-500" />
                  <span>Admin Console</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
