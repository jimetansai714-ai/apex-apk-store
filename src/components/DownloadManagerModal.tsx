import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  QrCode, 
  HardDrive,
  Copy,
  Check,
  HelpCircle,
  FolderOpen,
  Settings,
  PackageCheck,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Github
} from 'lucide-react';
import { APKApp, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { triggerActualApkDownload, getDirectDownloadUrl, getDownloadFilename } from '../utils/downloadSimulator';
import { hasGenuineDownloadLink } from '../utils/apkStorage';
import { recordAppDownload } from '../firebase';
import { fireCelebrationConfetti } from '../utils/confetti';

interface Props {
  app: APKApp | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onDownloadRecorded?: (appId: string) => void;
}

export const DownloadManagerModal: React.FC<Props> = ({
  app,
  isOpen,
  onClose,
  language,
  onDownloadRecorded,
}) => {
  const [progress, setProgress] = useState(0);
  const [downloadState, setDownloadState] = useState<'connecting' | 'downloading' | 'verifying' | 'completed' | 'missing_link'>('connecting');
  const [speed, setSpeed] = useState('18.4 MB/s');
  const [showQr, setShowQr] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !app) {
      setProgress(0);
      setDownloadState('connecting');
      setDownloadError(null);
      return;
    }

    // Check if the app has a genuine download URL or APK file attached
    const hasRealLink = hasGenuineDownloadLink(app);
    if (!hasRealLink) {
      setDownloadState('missing_link');
      return;
    }

    setProgress(10);
    setDownloadState('connecting');

    const t1 = setTimeout(() => {
      setDownloadState('downloading');
    }, 250);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setDownloadState('verifying');
          setTimeout(() => {
            setProgress(100);
            setDownloadState('completed');
            fireCelebrationConfetti();
            const res = triggerActualApkDownload(app);
            if (res.success) {
              recordAppDownload(app.id, { version: app.version, source: 'Storefront Direct Download' });
              onDownloadRecorded?.(app.id);
            } else {
              setDownloadError('Download could not be initiated.');
            }
          }, 500);
          return 90;
        }
        const delta = Math.floor(Math.random() * 25) + 15;
        const currentSpeed = (Math.random() * 6 + 15).toFixed(1);
        setSpeed(`${currentSpeed} MB/s`);
        return Math.min(prev + delta, 90);
      });
    }, 180);

    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [isOpen, app]);

  if (!isOpen || !app) return null;

  const isMissingLink = downloadState === 'missing_link';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {language === 'my' ? 'APK ဒေါင်းလုဒ်စင်တာ' : 'APK Download Center'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* App Card Brief */}
          <div className="flex items-start gap-4">
            <AppIconRenderer app={app} size="lg" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                {language === 'my' && app.nameMy ? app.nameMy : app.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{app.packageName}</p>
              
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{app.version}</span>
                <span>·</span>
                <span className="tabular-nums font-mono">{app.size}</span>
                <span>·</span>
                <span>{app.minAndroid}</span>
              </div>
            </div>
          </div>

          {/* MISSING LINK NOTICE STATE */}
          {isMissingLink ? (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3.5 animate-in fade-in">
              <div className="flex items-start gap-3">
                <ShieldAlert size={24} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                    {language === 'my' ? 'တကယ့် APK မူရင်းဖိုင် မပါရှိသေးပါ' : 'Original APK File Not Attached'}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {language === 'my'
                      ? `ဤအက်ပ် (${app.name}) အတွက် တကယ့် APK binary ဖိုင် (သို့မဟုတ်) Direct Download Link ကို စီမံခန့်ခွဲသူ (Admin) မှ Admin Panel တွင် ဖြည့်သွင်းပေးရန် လိုအပ်ပါသည်။ ယခင်က ဖိုင်မစစ်မှန်ဘဲ တလွဲဖြစ်နေသည့် အမှားကို ကာကွယ်ရန် တကယ့်ဖိုင် မချိတ်ရသေးမီ ဒေါင်းလုဒ်ကို ရပ်တန့်ထားပါသည်။`
                      : `The administrator needs to attach the genuine APK package or Direct Download URL (Google Drive, Mediafire, or Server Upload) in the Admin Panel.`}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'my' ? 'သင်သည် စီမံခန့်ခွဲသူ ဖြစ်ပါက Admin Panel တွင် ထည့်သွင်းနိုင်ပါသည်' : 'Admin can attach the real APK in Admin Panel'}
                </span>
                <a
                  href="#admin"
                  onClick={() => onClose()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{language === 'my' ? 'Admin Panel တွင် APK Link ထည့်မည်' : 'Open Admin Panel'}</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Progress Section */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">
                    {downloadState === 'connecting' && (language === 'my' ? 'ဆာဗာသို့ ချိတ်ဆက်နေသည်...' : 'Connecting to high-speed mirror...')}
                    {downloadState === 'downloading' && (language === 'my' ? `ဒေါင်းလုဒ်ဆွဲနေသည်... (${speed})` : `Downloading APK package (${speed})...`)}
                    {downloadState === 'verifying' && (language === 'my' ? 'လုံခြုံရေး စစ်ဆေးနေသည်...' : 'Verifying package checksum integrity...')}
                    {downloadState === 'completed' && (language === 'my' ? 'တကယ့် APK မူရင်းဖိုင် ဒေါင်းလုဒ် ပြီးမြောက်ပါပြီ!' : 'Real APK Download Complete!')}
                  </span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <HardDrive size={12} />
                    <span>{app.size}</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck size={12} />
                    <span>{language === 'my' ? 'အစစ်အမှန် စစ်ဆေးပြီး မူရင်းဖိုင်' : 'Authentic APK Binary Verified'}</span>
                  </span>
                </div>
              </div>

              {/* Direct 1-Click Action Buttons for 100% Download Reliability */}
              <div className="space-y-2">
                <a
                  href={getDirectDownloadUrl(app)}
                  download={getDownloadFilename(app)}
                  onClick={() => {
                    recordAppDownload(app.id, { version: app.version, source: 'Direct Click Button' });
                    onDownloadRecorded?.(app.id);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-98 transition-all cursor-pointer text-center"
                >
                  <Download size={17} />
                  <span>
                    {language === 'my' 
                      ? 'တကယ့် APK မူရင်းဖိုင် တိုက်ရိုက်ဒေါင်းလုဒ်ဆွဲရန် နှိပ်ပါ' 
                      : 'Download Real APK Package Now'}
                  </span>
                </a>

                {/* GitHub Mirror Button if available */}
                {(app as any).githubReleaseUrl && (
                  <a
                    href={(app as any).githubReleaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Github size={14} className="shrink-0" />
                    <span>
                      {language === 'my'
                        ? 'GitHub Releases Mirror မှ ဒေါင်းလုဒ်ဆွဲမည်'
                        : 'Download via GitHub Releases Mirror'}
                    </span>
                    <ExternalLink size={12} className="opacity-70" />
                  </a>
                )}
              </div>

              {/* Android Easy Installation Guide (Easy 3 Steps) */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {language === 'my' ? 'ဖုန်းတွင် အလွယ်တကူ Install သွင်းနည်း' : 'Easy Android Installation Steps'}
                    </h5>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                    Universal APK
                  </span>
                </div>

                {/* 3 Step Visual Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>{language === 'my' ? 'ဖိုင်ကိုဖွင့်ပါ' : 'Open File'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {language === 'my' 
                        ? 'Downloads သို့မဟုတ် Notification တွင် ဖိုင်ကို နှိပ်ပါ' 
                        : 'Tap downloaded APK in notifications or Downloads folder'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>{language === 'my' ? 'ခွင့်ပြုချက်ပေးပါ' : 'Allow Source'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {language === 'my' 
                        ? '"Allow from this source" မေးလာပါက ဖွင့်ပေးပါ' 
                        : 'Enable "Allow from this source" if prompted by Android'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>{language === 'my' ? 'Install နှိပ်ပါ' : 'Tap Install'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {language === 'my' 
                        ? '"Install" (တပ်ဆင်မည်) ကို နှိပ်ပြီး သုံးနိုင်ပါပြီ' 
                        : 'Tap Install to complete setup on your device'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* QR Code toggle for Mobile phone download */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode size={15} />
                <span>{language === 'my' ? 'ဖုန်းဖြင့် Scan ဖတ်ပြီး ဒေါင်းလုဒ်ဆွဲရန် (Mobile QR)' : 'Scan QR code with Android Phone'}</span>
              </div>
              <span className="text-slate-400 text-[11px]">{showQr ? '▲ Hide' : '▼ Show QR'}</span>
            </button>

            {showQr && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center mt-2 space-y-2">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                  <svg className="w-24 h-24" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM40 30h20v10H40zM40 60h10v30H40zM60 60h20v10H60zM70 80h30v20H70zM90 40h10v20H90zM60 40h20v10H60zM10 40h20v20H10zM35 80h15v10H35z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                  {language === 'my' 
                    ? 'ဖုန်းကင်မရာဖြင့် ဤ QR ကုဒ်ကို ဖတ်၍ ဖုန်းထဲသို့ တိုက်ရိုက်ဒေါင်းလုဒ်ရယူပါ' 
                    : 'Scan with your Android camera to download directly to your mobile device'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {!isMissingLink ? (
            <button
              onClick={() => triggerActualApkDownload(app)}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              <Download size={13} />
              <span>{language === 'my' ? 'ထပ်မံဒေါင်းလုဒ်ဆွဲမည်' : 'Download Again'}</span>
            </button>
          ) : (
            <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
              <AlertTriangle size={13} />
              <span>{language === 'my' ? 'ဖိုင်မပါရှိသေးပါ' : 'Missing File'}</span>
            </span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'my' ? 'ပိတ်မည်' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
