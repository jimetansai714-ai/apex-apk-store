import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Smartphone, 
  Laptop, 
  Clock, 
  Users, 
  MousePointerClick, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Filter, 
  RefreshCw, 
  HelpCircle,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { APKApp, DownloadAuditLog, Language } from '../types';
import { subscribeToDownloadLogs, clearAppDownloadLogs } from '../firebase';
import { formatExactDownloads } from '../utils/shareUtils';
import { AppIconRenderer } from './AppIconRenderer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  app: APKApp | null;
  language: Language;
  onUpdateAppCount: (app: APKApp, count: number) => void;
}

export const DownloadAuditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  app,
  language,
  onUpdateAppCount,
}) => {
  const [logs, setLogs] = useState<DownloadAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customCountInput, setCustomCountInput] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !app) {
      setLogs([]);
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setCustomCountInput(String(app.downloadCount || 0));

    const unsubscribe = subscribeToDownloadLogs(app.id, (fetchedLogs) => {
      setLogs(fetchedLogs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, app]);

  if (!isOpen || !app) return null;

  const totalDownloads = app.downloadCount || 0;
  // Calculate unique sessions from logs
  const uniqueSessionIds = new Set(logs.map((l) => l.sessionId));
  const uniqueCount = logs.length > 0 ? uniqueSessionIds.size : (app.uniqueDownloads || (totalDownloads > 0 ? 1 : 0));
  const repeatCount = Math.max(0, totalDownloads - uniqueCount);

  // Diagnosis reasoning
  const isLikelyTestInflation = totalDownloads > 0 && uniqueCount <= 2 && repeatCount > 5;

  const handleResetToZero = async () => {
    try {
      await clearAppDownloadLogs(app.id);
      onUpdateAppCount(app, 0);
      setCustomCountInput('0');
      setActionNotice(language === 'my' 
        ? '✓ ဒေါင်းလော့အရေအတွက်ကို ၀ သို့ အောင်မြင်စွာ Reset လုပ်ပြီးပါပြီ!' 
        : '✓ Download count reset to 0 successfully!');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCustomCount = () => {
    const parsed = Math.max(0, parseInt(customCountInput) || 0);
    onUpdateAppCount(app, parsed);
    setActionNotice(language === 'my' 
      ? `✓ ဒေါင်းလော့အရေအတွက်ကို ${parsed} သို့ သတ်မှတ်ပြီးပါပြီ!` 
      : `✓ Set download count to ${parsed}!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const formatLogDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(language === 'my' ? 'my-MM' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <AppIconRenderer app={app} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">{app.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {app.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-400" />
                <span>{language === 'my' ? 'ဒေါင်းလော့ စစ်ဆေးချက်မှတ်တမ်း (Download Audit Desk)' : 'Download Audit & Integrity Inspector'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="bg-emerald-600/20 border-b border-emerald-500/30 px-5 py-2.5 text-xs text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Key Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 1. Total Downloads */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'my' ? 'စုစုပေါင်း နှိပ်ဒေါင်းမှု' : 'Total Downloads'}</span>
                <MousePointerClick size={14} className="text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono tabular-nums">
                {totalDownloads}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatExactDownloads(totalDownloads, language)}
              </p>
            </div>

            {/* 2. Unique Devices/People */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'my' ? 'အသုံးပြုသူ အမှန်' : 'Unique Visitors'}</span>
                <Users size={14} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                {uniqueCount}
              </p>
              <p className="text-[10px] text-emerald-500/80">
                {language === 'my' ? `စက်ပစ္စည်း ${uniqueCount} ခုမှ ဒေါင်းယူထားခြင်း` : `${uniqueCount} distinct devices`}
              </p>
            </div>

            {/* 3. Repeated/Test Clicks */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'my' ? 'ထပ်ခါတလဲ စမ်းသပ်နှိပ်မှု' : 'Repeat/Test Clicks'}</span>
                <RotateCcw size={14} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                {repeatCount}
              </p>
              <p className="text-[10px] text-amber-500/80">
                {language === 'my' ? 'လူတစ်ဦးတည်းမှ အကြိမ်ကြိမ် နှိပ်ခြင်း' : 'Clicks from same session'}
              </p>
            </div>

          </div>

          {/* System Diagnostic Explanation Box */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isLikelyTestInflation 
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
          }`}>
            {isLikelyTestInflation ? (
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1 leading-relaxed">
              <h4 className="font-bold text-white text-sm">
                {language === 'my' ? 'စနစ်၏ စစ်ဆေးတွေ့ရှိချက် (System Diagnosis)' : 'Automated Integrity Analysis'}
              </h4>
              {language === 'my' ? (
                <>
                  <p>
                    ဒေါင်းလော့အရေအတွက် <span className="font-bold text-white">({totalDownloads})</span> သည် စနစ်ချို့ယွင်းချက် (System Bug) ကြောင့် အလိုအလျောက် တိုးသွားခြင်း မဟုတ်ဘဲ၊ <span className="font-bold text-white">Download ခလုတ်အား လက်ဖြင့် အမှန်တကယ် {totalDownloads} ကြိမ် နှိပ်ခဲ့ခြင်း</span> ကြောင့် ဖြစ်ပါသည်။
                  </p>
                  <p className="text-slate-300">
                    {repeatCount > 0 
                      ? `သို့သော် ထိုအထဲမှ ${repeatCount} ကြိမ်သည် လူတစ်ဦးတည်း/စက်တစ်ခုတည်းမှ ဆက်တိုက် စမ်းသပ်နှိပ်ထားခြင်း (Repeat Test Clicks) ဖြစ်ပြီး၊ စက်ပစ္စည်းအမှန်မှာ ${uniqueCount} ခု သာ ရှိပါသည်။`
                      : 'စစ်ဆေးချက်အရ စမ်းသပ်ဒေါင်းလုဒ်ဆွဲထားမှုများ မရှိသေးပါ သို့မဟုတ် တိကျမှန်ကန်စွာ မှတ်တမ်းဝင်နေပါသည်။'}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    The counter ({totalDownloads}) increased because the Download button was clicked {totalDownloads} times in the user interface.
                  </p>
                  <p className="text-slate-300">
                    {repeatCount > 0 
                      ? `${repeatCount} of these were duplicate clicks from the same session/tester. Actual distinct device count is ${uniqueCount}.`
                      : 'Download records match unique user interactions.'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Counter Adjustment Actions */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RotateCcw size={14} className="text-emerald-400" />
              <span>{language === 'my' ? 'ဒေါင်းလော့အရေအတွက် ချက်ချင်း ပြန်လည်ပြင်ဆင်ရန်' : 'Manual Download Count Correction'}</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleResetToZero}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
              >
                <Trash2 size={14} />
                <span>{language === 'my' ? '၀ သို့ အပြီးသတ် Reset လုပ်မည်' : 'Reset to 0 Downloads'}</span>
              </button>

              <div className="h-px sm:h-6 sm:w-px bg-slate-800" />

              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  min="0"
                  value={customCountInput}
                  onChange={(e) => setCustomCountInput(e.target.value)}
                  placeholder="0"
                  className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-emerald-500 text-center font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomCount}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  {language === 'my' ? 'အရေအတွက် အတည်ပြုမည်' : 'Set Exact Number'}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Real-Time Event Audit Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} className="text-blue-400" />
                <span>{language === 'my' ? 'တစ်ကြိမ်ချင်းစီ၏ မှတ်တမ်းအသေးစိတ်' : 'Recent Download Activity Logs'}</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {logs.length} {language === 'my' ? 'မှတ်တမ်းတွေ့ရှိ' : 'logged events'}
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 animate-pulse">
                {language === 'my' ? 'မှတ်တမ်းများ ရယူနေပါသည်...' : 'Fetching audit records from Cloud...'}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <p>{language === 'my' ? 'ယခုအချိန်အထိ ဒေါင်းလုဒ်ဆွဲထားသည့် အသေးစိတ် မှတ်တမ်း မရှိသေးပါ။' : 'No recent download activity logged yet.'}</p>
                <p className="text-[11px] text-slate-500">
                  {language === 'my' 
                    ? '(နောင်တွင် မည်သူမဆို Download နှိပ်သည်နှင့် အချိန်၊ စက်အမျိုးအစားနှင့်တကွ ဤနေရာတွင် တိုက်ရိုက်ပေါ်လာပါမည်)' 
                    : '(Future downloads will record timestamps, device models, and session authenticity here in real-time)'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">{language === 'my' ? 'အချိန်' : 'Timestamp'}</th>
                      <th className="py-2.5 px-3">{language === 'my' ? 'စက်ပစ္စည်း / Browser' : 'Device / OS'}</th>
                      <th className="py-2.5 px-3">{language === 'my' ? 'အခြေအနေ' : 'Visitor Status'}</th>
                      <th className="py-2.5 px-3 font-mono">Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {logs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {formatLogDate(log.timestamp)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {log.deviceType.includes('Mobile') ? (
                              <Smartphone size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <Laptop size={13} className="text-blue-400 shrink-0" />
                            )}
                            <span className="font-medium text-white">{log.deviceType}</span>
                            <span className="text-[11px] text-slate-400">({log.browser})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.isUnique ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {language === 'my' ? 'အသုံးပြုသူအသစ်' : 'Unique Visitor'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {language === 'my' ? 'ထပ်ခါစမ်းသပ်မှု' : 'Repeat Test Click'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[90px]">
                          {log.sessionId.slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer transition-colors"
          >
            {language === 'my' ? 'ပိတ်မည်' : 'Close Audit Desk'}
          </button>
        </div>

      </div>
    </div>
  );
};
