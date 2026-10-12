import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { getAppShareUrl, copyAppShareUrl } from '../utils/shareUtils';

interface Props {
  app: APKApp | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const QrCodeModal: React.FC<Props> = ({ app, isOpen, onClose, language }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !app) return;

    const shareUrl = getAppShareUrl(app);
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, app]);

  if (!isOpen || !app) return null;

  const shareUrl = getAppShareUrl(app);

  const handleCopyLink = async () => {
    await copyAppShareUrl(app);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${app.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <QrCode size={26} className="stroke-[2.5]" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'my' ? 'ဖုန်းဖြင့် Scan ဖတ်၍ သွင်းယူပါ' : 'Scan to Install on Phone'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'my' 
              ? 'သင့်ဖုန်းကင်မရာဖြင့် ချိန်လိုက်ပါက ဒေါင်းလုဒ်လင့်ခ် တိုက်ရိုက်ပွင့်သွားပါမည်' 
              : 'Point your Android phone camera to download directly'}
          </p>
        </div>

        {/* App Brief */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-left">
          <AppIconRenderer app={app} size="sm" />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {language === 'my' && app.nameMy ? app.nameMy : app.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{app.version}</span>
              <span>·</span>
              <span>{app.size}</span>
            </div>
          </div>
        </div>

        {/* QR Code Canvas Container */}
        <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500/30 inline-block shadow-md">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code for ${app.name}`} 
              className="w-52 h-52 mx-auto rounded-lg"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
              Generating QR...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck size={13} />
            <span>{language === 'my' ? 'လုံခြုံစိတ်ချရသော တိုက်ရိုက် APK လင့်ခ်' : 'Verified Secure Direct Link'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? (language === 'my' ? 'ကူးယူပြီး ✓' : 'Copied!') : (language === 'my' ? 'Link ကူးမည်' : 'Copy Link')}</span>
          </button>

          <button
            onClick={handleDownloadQr}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Download size={14} />
            <span>{language === 'my' ? 'QR ပုံသိမ်းမည်' : 'Save QR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
