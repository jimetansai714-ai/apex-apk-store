import React, { useState } from 'react';
import { MessageSquare, X, Send, Phone, Mail, Lock } from 'lucide-react';
import { Language } from '../types';

interface Props {
  onOpenContactModal: () => void;
  language: Language;
  onOpenAdmin?: () => void;
}

export const FloatingSupportButton: React.FC<Props> = ({ onOpenContactModal, language, onOpenAdmin }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
      
      {/* Expanded Quick Channels */}
      {isExpanded && (
        <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Admin Console Shortcut */}
          {onOpenAdmin && (
            <button
              onClick={() => {
                setIsExpanded(false);
                onOpenAdmin();
              }}
              title="Open Admin Console"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400 text-xs font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Lock size={12} className="stroke-[2.5]" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Telegram */}
          <a
            href="https://t.me/+959977500588"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on Telegram (+959977500588)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <span>Telegram</span>
            <Send size={13} />
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/959977500588"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp (+959977500588)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <span>WhatsApp</span>
            <Phone size={13} />
          </a>

          {/* Email */}
          <a
            href="mailto:jimetansai714@gmail.com"
            title="Email jimetansai714@gmail.com"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-white text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <span>jimetansai714@gmail.com</span>
            <Mail size={13} />
          </a>

          {/* Full Contact Desk */}
          <button
            onClick={() => {
              setIsExpanded(false);
              onOpenContactModal();
            }}
            className="px-3.5 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-bold shadow-lg hover:bg-emerald-600 transition-all cursor-pointer"
          >
            {language === 'my' ? 'အားလုံးဆက်သွယ်ရန်' : 'Full Support Desk'}
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
      >
        {isExpanded ? (
          <X size={18} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <MessageSquare size={16} className="stroke-[2.5]" />
            <span className="hidden sm:inline">
              {language === 'my' ? 'အကူအညီ / ဆက်သွယ်ရန်' : 'Support / Help'}
            </span>
          </div>
        )}
      </button>

    </div>
  );
};
