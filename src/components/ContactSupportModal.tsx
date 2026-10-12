import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const SUPPORT_EMAIL = 'jimetansai714@gmail.com';
const SUPPORT_PHONE = '+959977500588';
const SUPPORT_PHONE_FORMATTED = '+95 997 750 0588 (09-977500588)';

export const ContactSupportModal: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;
    setIsSent(true);
    setTimeout(() => {
      // open mailto
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${subject}] from ${name}`)}&body=${encodeURIComponent(message)}`;
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <MessageSquare size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'my' ? 'တရားဝင် ဆက်သွယ်ရန်နှင့် အကူအညီ' : 'Official Support & Contact Desk'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{language === 'my' ? 'အမြဲတမ်း အဆင်သင့်ရှိသည် (24/7 Response)' : 'Available 24/7 across multiple channels'}</span>
            </p>
          </div>
        </div>

        {/* Instant Messaging Channels Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          
          {/* Telegram */}
          <a
            href={`https://t.me/+959977500588`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 transition-all hover:scale-[1.02] cursor-pointer text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
              <Send size={18} className="translate-x-0.5" />
            </div>
            <span className="text-xs font-bold">Telegram</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Chat Directly</span>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/959977500588`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 transition-all hover:scale-[1.02] cursor-pointer text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
              <Phone size={18} />
            </div>
            <span className="text-xs font-bold">WhatsApp</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Instant Message</span>
          </a>

          {/* Viber */}
          <a
            href={`viber://chat?number=%2B959977500588`}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 transition-all hover:scale-[1.02] cursor-pointer text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
              <MessageSquare size={18} />
            </div>
            <span className="text-xs font-bold">Viber</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Mobile Connect</span>
          </a>

        </div>

        {/* Direct Email & Phone Copy Row */}
        <div className="space-y-2 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          
          {/* Email */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={15} className="text-emerald-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Email:</span>
              <a 
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>

            <button
              onClick={() => handleCopy(SUPPORT_EMAIL, 'email')}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
              title="Copy Email"
            >
              {copiedField === 'email' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Phone / Mobile */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={15} className="text-blue-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hotline:</span>
              <a 
                href={`tel:${SUPPORT_PHONE}`}
                className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-blue-500 truncate"
              >
                {SUPPORT_PHONE_FORMATTED}
              </a>
            </div>

            <button
              onClick={() => handleCopy(SUPPORT_PHONE, 'phone')}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
              title="Copy Phone"
            >
              {copiedField === 'phone' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

        </div>

        {/* Message Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {language === 'my' ? 'စာတို ပေးပို့ရန်' : 'Send a Direct Message'}
            </label>
            <span className="text-[11px] text-slate-400">Response within 2 hours</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'my' ? 'သင့်အမည်' : 'Your Name'}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="General Inquiry">General Inquiry / စုံစမ်းရန်</option>
              <option value="App Request">Request an APK / အက်ပ်တောင်းဆိုရန်</option>
              <option value="Developer Partnership">Developer Submission / Developer ဆက်သွယ်ရန်</option>
              <option value="DMCA Copyright">DMCA Takedown / မူပိုင်ခွင့် အကြောင်းကြားရန်</option>
              <option value="Bug Report">Technical Issue / အမှား သတင်းပို့ရန်</option>
            </select>
          </div>

          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              language === 'my'
                ? 'မေးမြန်းလိုသည့် အကြောင်းအရာ သို့မဟုတ် အကူအညီ လိုအပ်သည်များကို ရေးသားပေးပါ...'
                : 'Describe your inquiry, request, or issue...'
            }
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSent ? (
              <>
                <CheckCircle size={15} />
                <span>{language === 'my' ? 'ပေးပို့ပြီးပါပြီ!' : 'Opening Mail Client...'}</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>{language === 'my' ? 'သတင်းစကား ပေးပို့မည်' : 'Send Message Now'}</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
