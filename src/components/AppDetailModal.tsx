import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Star, 
  ShieldCheck, 
  Smartphone, 
  Calendar, 
  Layers, 
  Lock, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  Copy,
  History,
  Heart,
  QrCode,
  ArrowLeftRight,
  FileCheck,
  Github,
  ExternalLink
} from 'lucide-react';
import { APKApp, AppReview, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { MOCK_REVIEWS } from '../data/mockApps';
import { getAppShareUrl, copyAppShareUrl, formatExactDownloads } from '../utils/shareUtils';
import { subscribeToAppReviews, saveReviewToFirestore } from '../firebase';
import { fireCelebrationConfetti } from '../utils/confetti';
import { hasGenuineDownloadLink } from '../utils/apkStorage';

interface Props {
  app: APKApp | null;
  isOpen: boolean;
  onClose: () => void;
  onStartDownload: (app: APKApp) => void;
  language: Language;
  onSelectRelatedApp: (app: APKApp) => void;
  allApps: APKApp[];
  isWishlisted?: boolean;
  onToggleWishlist?: (appId: string) => void;
  onOpenQrCode?: (app: APKApp) => void;
  onOpenSecurityCert?: (app: APKApp) => void;
  onOpenCompare?: (app: APKApp) => void;
}

export const AppDetailModal: React.FC<Props> = ({
  app,
  isOpen,
  onClose,
  onStartDownload,
  language,
  onSelectRelatedApp,
  allApps,
  isWishlisted = false,
  onToggleWishlist,
  onOpenQrCode,
  onOpenSecurityCert,
  onOpenCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'reviews'>('overview');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review submission state
  const [userRating, setUserRating] = useState(5);
  const [reviewerName, setReviewerName] = useState(() => {
    try {
      return localStorage.getItem('apexapk_reviewer_name') || '';
    } catch {
      return '';
    }
  });
  const [reviewComment, setReviewComment] = useState('');
  const [reviewsList, setReviewsList] = useState<AppReview[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Subscribe to real-time reviews from Firestore
  React.useEffect(() => {
    if (!app) return;
    // Fast initial fallback
    setReviewsList(MOCK_REVIEWS[app.id] || []);

    const unsub = subscribeToAppReviews(app.id, (firestoreReviews) => {
      if (firestoreReviews.length > 0) {
        setReviewsList(firestoreReviews);
      }
    });
    return () => unsub();
  }, [app?.id]);

  if (!isOpen || !app) return null;

  const totalReviewsCount = reviewsList.length;
  const averageRating = totalReviewsCount > 0
    ? Number((reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviewsCount).toFixed(1))
    : app.rating;

  const handleShare = async () => {
    const shareUrl = getAppShareUrl(app);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${app.name} APK Download`,
          text: `Download verified ${app.name} APK on P-Store`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback
      }
    }
    await copyAppShareUrl(app);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyDirectLink = async () => {
    await copyAppShareUrl(app);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    try {
      localStorage.setItem('apexapk_reviewer_name', reviewerName.trim());
    } catch {
      // ignore
    }

    const newRev: AppReview = {
      id: `rev-${Date.now()}`,
      author: reviewerName.trim(),
      rating: userRating,
      date: new Date().toISOString().split('T')[0],
      comment: reviewComment.trim(),
      helpfulCount: 0,
    };

    setIsSubmittingReview(true);
    setReviewsList((prev) => [newRev, ...prev.filter((r) => r.id !== newRev.id)]);
    setReviewComment('');
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 3000);

    // Save to Cloud Firestore
    await saveReviewToFirestore(app.id, newRev);
    setIsSubmittingReview(false);
  };

  const similarApps = allApps
    .filter((a) => a.id !== app.id && (a.category === app.category || a.isEditorChoice))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:py-8">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky modal top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
              {app.categoryName}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {app.packageName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleWishlist && (
              <button
                onClick={() => onToggleWishlist(app.id)}
                title={isWishlisted ? (language === 'my' ? 'အကြိုက်ဆုံးမှ ဖယ်ရှားမည်' : 'Remove favorite') : (language === 'my' ? 'အကြိုက်ဆုံးထဲ ထည့်မည်' : 'Save to favorites')}
                className="p-2 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Heart size={16} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
              </button>
            )}

            {onOpenQrCode && (
              <button
                onClick={() => onOpenQrCode(app)}
                title={language === 'my' ? 'ဖုန်းဖြင့် Scan ဖတ်ရန် QR Code ကြည့်မည်' : 'Scan QR for phone'}
                className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <QrCode size={16} />
              </button>
            )}

            {onOpenCompare && (
              <button
                onClick={() => onOpenCompare(app)}
                title={language === 'my' ? 'ဆော့ဖ်ဝဲလ် အချင်းချင်း နှိုင်းယှဉ်ချက်' : 'Compare with another app'}
                className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={16} />
              </button>
            )}

            <button
              onClick={handleShare}
              title="Share"
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable details content */}
        <div className="p-6 sm:p-8 space-y-7 max-h-[85vh] overflow-y-auto">
          
          {/* Header Zone: App Icon + Titles + Primary Download Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-5">
              <AppIconRenderer app={app} size="xl" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {language === 'my' && app.nameMy ? app.nameMy : app.name}
                </h1>
                {language === 'my' && app.nameMy && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {app.name}
                  </p>
                )}
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {app.developer}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{app.version}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => onOpenSecurityCert?.(app)}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>P-Store Safe (Verified)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  fireCelebrationConfetti();
                  onStartDownload(app);
                }}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-98 cursor-pointer ${
                  hasGenuineDownloadLink(app)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Download size={18} className="stroke-[2.5]" />
                <span>
                  {language === 'my' 
                    ? `APK ဒေါင်းလုဒ်ဆွဲရန် (${app.size})` 
                    : `Download APK (${app.size})`}
                </span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                {hasGenuineDownloadLink(app) 
                  ? (language === 'my' ? '✓ စစ်မှန်သော မူရင်း APK ဖိုင်' : '100% Free · Direct Fast Mirror')
                  : (language === 'my' ? '⚠️ တကယ့် ဖိုင်/Link ထည့်သွင်းရန် လိုအပ်ဆဲဖြစ်သည်' : '⚠️ Original APK file pending attachment')}
              </p>
            </div>
          </div>

          {/* Interactive Feature Strip: QR, Security, Compare, Bookmark */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenQrCode && (
              <button
                type="button"
                onClick={() => onOpenQrCode(app)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
              >
                <QrCode size={13} className="text-emerald-500" />
                <span>{language === 'my' ? 'ဖုန်းဖြင့် Scan ဖတ်ရန်' : 'Scan QR for Phone'}</span>
              </button>
            )}

            {onOpenSecurityCert && (
              <button
                type="button"
                onClick={() => onOpenSecurityCert(app)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/30"
              >
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>{language === 'my' ? 'လုံခြုံရေး အစီရင်ခံစာ ကြည့်မည်' : 'Security Certificate'}</span>
              </button>
            )}

            {onOpenCompare && (
              <button
                type="button"
                onClick={() => onOpenCompare(app)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
              >
                <ArrowLeftRight size={13} className="text-emerald-500" />
                <span>{language === 'my' ? 'အခြား App ဖြင့် နှိုင်းယှဉ်မည်' : 'Compare Spec'}</span>
              </button>
            )}

            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(app.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  isWishlisted
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-500 border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <Heart size={13} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
                <span>{isWishlisted ? (language === 'my' ? 'သိမ်းဆည်းထားပြီး ✓' : 'Saved ✓') : (language === 'my' ? 'အကြိုက်ဆုံး မှတ်သားမည်' : 'Add to Collection')}</span>
              </button>
            )}

            {app.githubReleaseUrl && (
              <a
                href={app.githubReleaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
              >
                <Github size={13} className="text-slate-700 dark:text-slate-300" />
                <span>GitHub Release</span>
                <ExternalLink size={11} className="opacity-60" />
              </a>
            )}
          </div>

          {/* Direct Share Link for APK Owners & Community */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-800/40">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Link2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    {language === 'my' ? 'တိုက်ရိုက် ဒေါင်းလုဒ် Share Link' : 'Direct Shareable Link'}
                  </p>
                  <span className="text-[10px] text-slate-400">· {language === 'my' ? 'ဤလင့်ခ်ကို နှိပ်ပါက ဤအက်ပ်သို့ တန်းရောက်မည်' : 'Instant Jump'}</span>
                </div>
                <p className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">
                  {getAppShareUrl(app)}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyDirectLink}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>
                {copiedLink 
                  ? (language === 'my' ? 'လင့်ခ် ကူးယူပြီး ✓' : 'Link Copied! ✓') 
                  : (language === 'my' ? 'လင့်ခ် ကူးယူမည် (Copy Link)' : 'Copy Direct Link')}
              </span>
            </button>
          </div>

          {/* Metric Bar (Play store style metrics: Rating, Downloads, Size, Age) */}
          <div className="grid grid-cols-4 gap-2 py-4 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <div className="border-r border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-center gap-1 font-bold text-slate-900 dark:text-white text-base">
                <span className="tabular-nums">{averageRating}</span>
                <Star size={15} className="fill-amber-400 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {totalReviewsCount > 0 
                  ? `${totalReviewsCount} ${language === 'my' ? 'မှတ်ချက်' : 'reviews'}` 
                  : (language === 'my' ? 'မှတ်ချက်မရှိသေး' : '0 reviews')}
              </p>
            </div>

            <div className="border-r border-slate-200 dark:border-slate-700/80">
              <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tabular-nums">
                {formatExactDownloads(app.downloadCount, language)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'my' ? 'ဒေါင်းလုဒ်ဆွဲသူ' : 'Downloads'}
              </p>
            </div>

            <div className="border-r border-slate-200 dark:border-slate-700/80">
              <div className="font-bold text-slate-900 dark:text-white text-base tabular-nums font-mono">
                {app.size}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'my' ? 'ဖိုင်အရွယ်အစား' : 'File Size'}
              </p>
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base">
                Rated 3+
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Everyone
              </p>
            </div>
          </div>

          {/* Screenshots Gallery */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {language === 'my' ? 'မျက်နှာပြင်ပုံရိပ်များ' : 'App Preview & Screenshots'}
            </h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {app.screenshots.map((screenshot, idx) => {
                const isImage = screenshot.startsWith('data:image') || screenshot.startsWith('http');
                if (isImage) {
                  return (
                    <div
                      key={idx}
                      className="w-56 h-80 shrink-0 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-md bg-slate-900 group relative"
                    >
                      <img 
                        src={screenshot} 
                        alt={`${app.name} preview ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90">
                        {idx + 1}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="w-56 h-80 shrink-0 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 p-4 border border-slate-300 dark:border-slate-700 flex flex-col justify-between shadow-md relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Preview #{idx + 1}</span>
                      <Smartphone size={14} />
                    </div>

                    <div className="space-y-3 my-auto">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto text-emerald-400">
                        <Smartphone size={24} />
                      </div>
                      <p className="text-xs text-center font-medium text-slate-200 leading-snug px-2">
                        {screenshot}
                      </p>
                    </div>

                    <div className="h-1 bg-white/20 rounded-full w-1/3 mx-auto" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: About this app */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'ဤအက်ပ်အကြောင်း' : 'About this app'}
              </h3>
            </div>
            
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                {language === 'my' && app.descriptionMy ? app.descriptionMy : app.description}
              </p>

              {isDescExpanded && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {language === 'my' ? 'အဓိက အင်္ဂါရပ်များ' : 'Key Highlights'}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <li>Native Android optimization with zero telemetry lag</li>
                    <li>Verified clean SHA-256 package signature</li>
                    <li>Supports Android 6.0 through Android 15.0+</li>
                    <li>Universal architecture (arm64-v8a / armeabi-v7a)</li>
                  </ul>
                </div>
              )}

              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <span>{isDescExpanded ? (language === 'my' ? 'လျော့နည်းစွာ ပြသရန်' : 'Show less') : (language === 'my' ? 'ပိုမိုဖတ်ရှုရန်' : 'Read more')}</span>
                {isDescExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Section: What's New */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'my' ? `ဗားရှင်း ${app.version} တွင် ပါဝင်သောအရာများ` : `What's new in version ${app.version}`}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  {language === 'my' ? 'နောက်ဆုံးထွက်' : 'LATEST'}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">{app.uploadedAt}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'my' && app.changelogMy ? app.changelogMy : app.changelog}
            </p>

            {/* Version History Toggle if exists */}
            {app.versionHistory && app.versionHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <History size={13} />
                  <span>
                    {language === 'my'
                      ? `ယခင်ဗားရှင်း မှတ်တမ်းများ (${app.versionHistory.length})`
                      : `Previous Version History (${app.versionHistory.length})`}
                  </span>
                  {showVersionHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showVersionHistory && (
                  <div className="mt-2.5 space-y-2 animate-in fade-in">
                    {app.versionHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {hist.version}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {hist.date} {hist.size ? `· ${hist.size}` : ''}
                          </span>
                        </div>
                        {hist.changelog && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {hist.changelog}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Specifications Table */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'my' ? 'နည်းပညာဆိုင်ရာ အချက်အလက်များ' : 'Technical Specifications'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Package Name</span>
                <span className="font-mono text-slate-900 dark:text-slate-200 truncate ml-2 font-medium">{app.packageName}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Version</span>
                <span className="font-mono text-slate-900 dark:text-slate-200 font-medium">{app.version}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Min Android Requirement</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{app.minAndroid}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Architecture</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">arm64-v8a / universal</span>
              </div>
            </div>

            {/* SHA-256 Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">SHA-256 Package Signature</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                  <ShieldCheck size={13} /> Verified Clean
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all select-all">
                {app.sha256}
              </div>
            </div>

            {/* Permissions list */}
            {app.permissions && app.permissions.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'my' ? 'လိုအပ်သော ခွင့်ပြုချက်များ' : 'Required App Permissions'}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {app.permissions.map((perm, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Ratings & Reviews */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'သုံးသပ်ချက်များနှင့် အဆင့်သတ်မှတ်ချက်' : 'Ratings & Reviews'}
              </h3>
              <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{averageRating}</span>
                <span className="text-slate-400 font-normal">/ 5.0</span>
              </div>
            </div>

            {/* Reviews submission form */}
            <form onSubmit={handleAddReview} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {language === 'my' ? 'မှတ်ချက်နှင့် အဆင့်သတ်မှတ်ချက် ရေးသားရန်' : 'Write a Review & Rating'}
                </h4>
                {reviewSuccessMsg && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                    <Check size={14} />
                    <span>{language === 'my' ? 'သုံးသပ်ချက် အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ ✓' : 'Review posted successfully! ✓'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'my' ? 'သင့်ပေးလိုသော အဆင့်:' : 'Your Rating:'}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-0.5 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star size={20} className={star <= userRating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-1">
                    {userRating}.0 ★
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={language === 'my' ? 'သင့်အမည် (ဥပမာ- ကိုမင်းမင်း)' : 'Your Name'}
                  className="px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <textarea
                required
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={language === 'my' ? 'ဤဆော့ဖ်ဝဲလ် အသုံးပြုရ အဆင်ပြေပုံ သုံးသပ်ချက်ရေးသားပါ...' : 'Share your experience with this APK...'}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? (language === 'my' ? 'တင်သွင်းနေပါသည်...' : 'Posting...') : (language === 'my' ? 'သုံးသပ်ချက် တင်သွင်းမည်' : 'Post Review')}
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviewsList.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800">
                  <p className="text-xs text-slate-400">
                    {language === 'my' 
                      ? 'သုံးသပ်ချက် မရှိသေးပါ။ ပထမဆုံး သုံးသပ်ချက်နှင့် အဆင့်သတ်မှတ်ချက် ပေးပို့သူ ဖြစ်ပါစေ!' 
                      : 'No reviews yet. Be the first to share your rating & review!'}
                  </p>
                </div>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-slate-50/70 dark:bg-slate-800/30 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">{rev.author}</span>
                      <span className="text-slate-400 tabular-nums">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Similar Apps */}
          {similarApps.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'အလားတူ အကြံပြုထားသော အက်ပ်များ' : 'Similar & Recommended Apps'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similarApps.map((simApp) => (
                  <div
                    key={simApp.id}
                    onClick={() => onSelectRelatedApp(simApp)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center group border border-slate-200/60 dark:border-slate-800"
                  >
                    <AppIconRenderer app={simApp} size="md" className="mx-auto mb-2 group-hover:scale-105 transition-transform" />
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {language === 'my' && simApp.nameMy ? simApp.nameMy : simApp.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{simApp.categoryName}</p>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span>{simApp.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
