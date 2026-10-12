import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Flame, 
  TrendingUp, 
  SearchX, 
  CheckCircle,
  Trophy,
  Upload,
  PackageOpen,
  ArrowRight,
  Lock
} from 'lucide-react';
import { APKApp, AppCategory, Language } from './types';
import { PolicyType } from './data/policyContent';
import { Navbar } from './components/Navbar';
import { TopHeroBanner } from './components/TopHeroBanner';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryBar } from './components/CategoryBar';
import { TrendingBar } from './components/TrendingBar';
import { AppCard } from './components/AppCard';
import { PlayStoreAppCard, PlayStoreListRow } from './components/PlayStoreAppCard';
import { TopRankedRow } from './components/TopRankedRow';
import { AppDetailModal } from './components/AppDetailModal';
import { DownloadManagerModal } from './components/DownloadManagerModal';
import { WishlistModal } from './components/WishlistModal';
import { AppCompareModal } from './components/AppCompareModal';
import { QrCodeModal } from './components/QrCodeModal';
import { SecurityCertModal } from './components/SecurityCertModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { Footer } from './components/Footer';
import { ContactSupportModal } from './components/ContactSupportModal';
import { PolicyModal } from './components/PolicyModal';
import { FloatingSupportButton } from './components/FloatingSupportButton';
import { FAQSection } from './components/FAQSection';
import { CookieBanner } from './components/CookieBanner';
import { AdminStandaloneApp } from './admin';
import { 
  playClickSound, 
  playDownloadSound, 
  playHeartSound, 
  isSoundEnabled, 
  setSoundEnabled 
} from './utils/soundEffects';
import { 
  subscribeToAppsCatalog, 
  testFirestoreConnection,
  purgeAllOldMockAppsFromFirestore
} from './firebase';

export default function App() {
  // Theme & Language
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [language, setLanguage] = useState<Language>('my');

  // Support & Policy Modals State
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyType | null>(null);

  // Universal Admin View detection (Supports /admin.html, /admin, ?admin, #admin)
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return path.includes('admin') || search.includes('admin') || hash.includes('admin');
    } catch {
      return false;
    }
  });

  // Keep isAdminView in sync with browser URL hash / popstate without forcing full page reloads
  useEffect(() => {
    const handleUrlRoute = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        setIsAdminView(path.includes('admin') || search.includes('admin') || hash.includes('admin'));
      } catch {
        setIsAdminView(false);
      }
    };
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setIsAdminView(true);
    try {
      window.location.hash = 'admin';
    } catch {}
  }, []);

  const handleExitAdmin = useCallback(() => {
    setIsAdminView(false);
    try {
      if (window.location.hash.toLowerCase().includes('admin')) {
        window.history.pushState(null, '', window.location.pathname);
      }
    } catch {}
  }, []);

  // Apps state - starts clean without mock data
  const [apps, setApps] = useState<APKApp[]>(() => {
    try {
      const stored = localStorage.getItem('apexapk_full_catalog');
      if (stored) {
        const parsed: APKApp[] = JSON.parse(stored);
        // Exclude any old mock apps
        return parsed.filter((a) => a.customUploaded && !a.id.startsWith('app-pyi') && !a.id.startsWith('app-shadow'));
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Real-time Firestore Sync
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = subscribeToAppsCatalog((firestoreApps) => {
      // Only keep real user-uploaded apps
      const realApps = firestoreApps.filter(
        (a) => a.customUploaded || (!a.id.startsWith('app-pyi') && !a.id.startsWith('app-shadow') && !a.id.startsWith('app-wave') && !a.id.startsWith('app-hyper') && !a.id.startsWith('app-myan') && !a.id.startsWith('app-pixel') && !a.id.startsWith('app-doc') && !a.id.startsWith('app-sec') && !a.id.startsWith('app-speed'))
      );
      setApps(realApps);
      localStorage.setItem('apexapk_full_catalog', JSON.stringify(realApps));
    });

    return () => unsubscribe();
  }, []);

  // Listen to cross-tab storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('apexapk_full_catalog');
        if (stored) {
          setApps(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filters & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AppCategory>('all');
  const [activeNavTab, setActiveNavTab] = useState('apps');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<APKApp | null>(null);
  const [downloadingApp, setDownloadingApp] = useState<APKApp | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparePrimaryApp, setComparePrimaryApp] = useState<APKApp | null>(null);
  const [qrApp, setQrApp] = useState<APKApp | null>(null);
  const [securityCertApp, setSecurityCertApp] = useState<APKApp | null>(null);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => isSoundEnabled());

  // Wishlist state persisted in localStorage
  const [wishlistAppIds, setWishlistAppIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('apexapk_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (appId: string) => {
    setWishlistAppIds((prev) => {
      const exists = prev.includes(appId);
      const next = exists ? prev.filter((id) => id !== appId) : [...prev, appId];
      try {
        localStorage.setItem('apexapk_wishlist', JSON.stringify(next));
      } catch {}
      if (!exists) {
        playHeartSound();
        setToastMessage(language === 'my' ? 'အကြိုက်ဆုံးစာရင်းထဲ ထည့်သွင်းပြီးပါပြီ ❤️' : 'Added to favorites ❤️');
      } else {
        setToastMessage(language === 'my' ? 'အကြိုက်ဆုံးစာရင်းမှ ဖယ်ရှားလိုက်ပါပြီ' : 'Removed from favorites');
      }
      setTimeout(() => setToastMessage(null), 2500);
      return next;
    });
  };

  const wishlistApps = useMemo(() => {
    return apps.filter((a) => wishlistAppIds.includes(a.id));
  }, [apps, wishlistAppIds]);

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const handleSelectApp = (app: APKApp) => {
    playClickSound();
    setSelectedApp(app);
  };

  const handleOpenCompare = (app: APKApp) => {
    playClickSound();
    setComparePrimaryApp(app);
    setIsCompareOpen(true);
  };

  const handleOpenQr = (app: APKApp) => {
    playClickSound();
    setQrApp(app);
  };

  const handleOpenSecurityCert = (app: APKApp) => {
    playClickSound();
    setSecurityCertApp(app);
  };

  // Deep-linking URL handler: automatically opens app if link contains ?app=... or #app=...
  useEffect(() => {
    if (apps.length === 0) return;

    const resolveDeepLink = () => {
      try {
        const url = new URL(window.location.href);
        const appParam = url.searchParams.get('app') || url.searchParams.get('id');
        const pkgParam = url.searchParams.get('package') || url.searchParams.get('pkg');

        let matchedApp: APKApp | undefined = undefined;

        if (appParam) {
          matchedApp = apps.find((a) => a.id.toLowerCase() === appParam.toLowerCase());
        }
        if (!matchedApp && pkgParam) {
          matchedApp = apps.find((a) => a.packageName.toLowerCase() === pkgParam.toLowerCase());
        }

        // Check hash pattern e.g. #app=app-123 or #/app/app-123
        if (!matchedApp && window.location.hash) {
          const hash = window.location.hash.replace(/^#\/?/, '');
          const hashMatch = hash.match(/(?:app=|app\/)?([a-zA-Z0-9_-]+)/);
          if (hashMatch && hashMatch[1] && hashMatch[1] !== 'admin') {
            const idOrPkg = hashMatch[1].toLowerCase();
            matchedApp = apps.find(
              (a) => a.id.toLowerCase() === idOrPkg || a.packageName.toLowerCase() === idOrPkg
            );
          }
        }

        if (matchedApp) {
          setSelectedApp(matchedApp);
        }
      } catch {
        // ignore
      }
    };

    resolveDeepLink();
    window.addEventListener('popstate', resolveDeepLink);
    window.addEventListener('hashchange', resolveDeepLink);
    return () => {
      window.removeEventListener('popstate', resolveDeepLink);
      window.removeEventListener('hashchange', resolveDeepLink);
    };
  }, [apps]);

  // Keep selectedApp fresh when apps catalog updates in real-time
  useEffect(() => {
    if (selectedApp) {
      const refreshed = apps.find((a) => a.id === selectedApp.id);
      if (
        refreshed &&
        (refreshed.downloadCount !== selectedApp.downloadCount ||
          refreshed.rating !== selectedApp.rating ||
          refreshed.ratingsCount !== selectedApp.ratingsCount)
      ) {
        setSelectedApp(refreshed);
      }
    }
  }, [apps, selectedApp]);

  // Keep URL updated with ?app=... when modal opens / closes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedApp) {
        url.searchParams.set('app', selectedApp.id);
        window.history.replaceState({}, '', url.toString());
      } else {
        if (url.searchParams.has('app')) {
          url.searchParams.delete('app');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch {
      // ignore
    }
  }, [selectedApp]);

  // Sync dark theme with HTML root class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Quick 1-click download trigger
  const handleQuickDownload = (app: APKApp, e: React.MouseEvent) => {
    e.stopPropagation();
    playDownloadSound();
    setDownloadingApp(app);
  };

  // Immediate local update when download is completed and recorded in Firestore
  const handleDownloadRecorded = (appId: string) => {
    setApps((prevApps) =>
      prevApps.map((a) => {
        if (a.id === appId) {
          const newCount = (a.downloadCount || 0) + 1;
          return {
            ...a,
            downloadCount: newCount,
            downloads: `${newCount} downloads`,
          };
        }
        return a;
      })
    );
  };

  // Handle nav tab clicks
  const handleNavTabChange = (tabId: string) => {
    setActiveNavTab(tabId);
    setSearchQuery('');
    if (tabId === 'apps') {
      setActiveCategory('all');
    } else if (tabId === 'games') {
      setActiveCategory('games');
    } else if (tabId === 'charts') {
      setActiveCategory('all');
    } else if (tabId === 'myanmar') {
      setActiveCategory('myanmar');
    }
  };

  // #1 Top Downloaded App
  const sortedByDownloads = useMemo(() => {
    return [...apps].sort((a, b) => b.downloadCount - a.downloadCount);
  }, [apps]);

  const topDownloadedApp = sortedByDownloads[0] || null;
  const runnerUpApps = sortedByDownloads.slice(1, 3);

  // Filtered & Sorted Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesNameMy = app.nameMy?.toLowerCase().includes(q);
        const matchesPkg = app.packageName.toLowerCase().includes(q);
        const matchesDev = app.developer.toLowerCase().includes(q);
        const matchesCat = app.categoryName.toLowerCase().includes(q);
        if (!matchesName && !matchesNameMy && !matchesPkg && !matchesDev && !matchesCat) {
          return false;
        }
      }

      // Nav Tab constraints
      if (activeNavTab === 'games' && app.category !== 'games') {
        return false;
      }
      if (activeNavTab === 'myanmar' && app.category !== 'myanmar' && !app.nameMy) {
        return false;
      }

      // Category filter
      if (activeCategory !== 'all' && app.category !== activeCategory) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      return b.downloadCount - a.downloadCount;
    });
  }, [apps, searchQuery, activeCategory, activeNavTab, sortBy]);

  // Top Ranked Leaderboard
  const topRankedApps = useMemo(() => {
    return sortedByDownloads.slice(0, 6);
  }, [sortedByDownloads]);

  // Newly Uploaded Apps
  const newlyUploadedApps = useMemo(() => {
    return [...apps].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 4);
  }, [apps]);

  const customUploadedCount = apps.filter((a) => a.customUploaded).length;

  if (isAdminView) {
    return (
      <AdminStandaloneApp
        onExit={handleExitAdmin}
        initialApps={apps}
      />
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      
      {/* PWA 1-Tap Home Screen Banner */}
      <PwaInstallBanner language={language} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-4 text-xs font-semibold">
          <CheckCircle size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeNavTab={activeNavTab}
        onNavTabChange={handleNavTabChange}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'my' : 'en')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenPolicy={(tab) => setActivePolicyTab(tab)}
        wishlistCount={wishlistApps.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCompare={() => {
          if (apps.length > 0) {
            setComparePrimaryApp(apps[0]);
            setIsCompareOpen(true);
          }
        }}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Category Horizontal Filter Bar */}
        <CategoryBar
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setSearchQuery('');
          }}
          language={language}
          customUploadCount={customUploadedCount}
        />

        {/* Dynamic Trending Tags, Random Surprise Me 🎲, Sound FX and Security Guarantee */}
        <TrendingBar
          language={language}
          onSearchTag={(tag) => {
            setSearchQuery(tag);
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }}
          apps={apps}
          onSelectApp={handleSelectApp}
          isSoundOn={isSoundOn}
          onToggleSound={handleToggleSound}
        />

        {/* Clean Empty State when no apps uploaded yet */}
        {apps.length === 0 ? (
          <div className="py-20 text-center space-y-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 max-w-xl mx-auto shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <PackageOpen size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'ဆော့ဖ်ဝဲလ် အသစ်များ မကြာမီ တင်သွင်းလာပါမည်' : 'Fresh Applications Coming Soon'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {language === 'my' 
                  ? 'ကျွန်ုပ်တို့၏ စစ်ဆေးပြီး Android ဆော့ဖ်ဝဲလ် ကတ်တလောက်ကို အသစ်စက်စက် ဗားရှင်းများဖြင့် မွမ်းမံပြင်ဆင်နေပါသည်။ မကြာမီ ပြန်လည်ကြည့်ရှုပေးပါခင်ဗျာ။' 
                  : 'Our verified Android package catalog is being prepared with high-performance releases. Check back shortly!'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsContactOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>{language === 'my' ? 'အကူအညီ / ဆက်သွယ်ရန်' : 'Contact Support'}</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={handleOpenAdmin}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Lock size={13} className="stroke-[2.5]" />
                <span>{language === 'my' ? 'Admin ဝင်မည်' : 'Open Admin Panel'}</span>
              </button>
            </div>
          </div>
        ) : searchQuery.trim() ? (
          /* Search Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {language === 'my' ? `"${searchQuery}" အတွက် ရှာဖွေမှုရလဒ်များ` : `Search results for "${searchQuery}"`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {filteredApps.length} {language === 'my' ? 'ခု တွေ့ရှိပါသည်' : 'packages found'}
                </p>
              </div>

              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                {language === 'my' ? 'ရှာဖွေမှုကို ရှင်းလင်းမည်' : 'Clear search'}
              </button>
            </div>

            {filteredApps.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <SearchX size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                    {language === 'my' ? 'ကိုက်ညီသော APK မတွေ့ရှိပါ' : 'No APK found matching your query'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {language === 'my' 
                      ? 'အခြားအမည်ဖြင့် ရှာဖွေကြည့်ပါ။' 
                      : 'Try different keywords or check spelling.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onSelect={handleSelectApp}
                    onQuickDownload={handleQuickDownload}
                    language={language}
                    isWishlisted={wishlistAppIds.includes(app.id)}
                    onToggleWishlist={toggleWishlist}
                    onOpenQrCode={handleOpenQr}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Discovery View with Real Apps */
          <div className="space-y-10">
            
            {/* Top Interactive Hero Carousel or Spotlight Banner */}
            {activeCategory === 'all' && activeNavTab !== 'charts' && (
              apps.length > 1 ? (
                <HeroCarousel
                  featuredApps={sortedByDownloads.slice(0, 5)}
                  onSelectApp={handleSelectApp}
                  onQuickDownload={handleQuickDownload}
                  language={language}
                  isWishlisted={(id) => wishlistAppIds.includes(id)}
                  onToggleWishlist={toggleWishlist}
                />
              ) : topDownloadedApp ? (
                <TopHeroBanner
                  topApp={topDownloadedApp}
                  runnerUps={runnerUpApps}
                  onSelectApp={handleSelectApp}
                  onQuickDownload={handleQuickDownload}
                  language={language}
                />
              ) : null
            )}

            {/* If user is looking at Top Charts specifically */}
            {activeNavTab === 'charts' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-500" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {language === 'my' ? 'ထိပ်တန်း အခမဲ့ APK စာရင်း' : 'Top Free Android Packages'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Ranked by verified downloads</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {topRankedApps.map((app, index) => (
                    <TopRankedRow
                      key={app.id}
                      app={app}
                      rank={index + 1}
                      onSelect={handleSelectApp}
                      onQuickDownload={handleQuickDownload}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Section 1: Recommended For You (Google Play Store Style matching user's photo) */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{language === 'my' ? 'သင့်အတွက် အထူးအကြံပြုထားသော အက်ပ်များ' : 'Recommended for you'}</span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 dark:text-slate-500 text-sm font-bold">→</span>
                    </div>
                  </div>

                  {/* Horizontal scroll of Play Store squircle app cards */}
                  <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
                    {filteredApps.map((app) => (
                      <PlayStoreAppCard
                        key={app.id}
                        app={app}
                        onSelect={handleSelectApp}
                        onQuickDownload={handleQuickDownload}
                        language={language}
                        isWishlisted={wishlistAppIds.includes(app.id)}
                        onToggleWishlist={toggleWishlist}
                      />
                    ))}
                  </div>
                </section>

                {/* Section 1.5: Suggested for you (Google Play Store List Rows matching user's photo) */}
                <section className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {language === 'my' ? 'လူကြိုက်များသော အက်ပ်များ' : 'Suggested for you'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                    {filteredApps.map((app) => (
                      <PlayStoreListRow
                        key={app.id}
                        app={app}
                        onSelect={handleSelectApp}
                        onQuickDownload={handleQuickDownload}
                        language={language}
                        isWishlisted={wishlistAppIds.includes(app.id)}
                        onToggleWishlist={toggleWishlist}
                      />
                    ))}
                  </div>
                </section>

                {/* Section 2: Top Charts Leaderboard Grid */}
                {apps.length > 2 && activeCategory === 'all' && (
                  <section className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame size={18} className="text-amber-500" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {language === 'my' ? 'ထိပ်တန်း ဒေါင်းလုဒ်အများဆုံး စာရင်း' : 'Top Downloaded APKs'}
                        </h2>
                      </div>
                      <button
                        onClick={() => handleNavTabChange('charts')}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {language === 'my' ? 'အားလုံးကြည့်ရန်' : 'View full chart →'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                      {topRankedApps.map((app, index) => (
                        <TopRankedRow
                          key={app.id}
                          app={app}
                          rank={index + 1}
                          onSelect={handleSelectApp}
                          onQuickDownload={handleQuickDownload}
                          language={language}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 3: Newly Uploaded APKs */}
                {newlyUploadedApps.length > 0 && (
                  <section className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{language === 'my' ? 'အသစ်တင်ထားသော APK များ' : 'Fresh & Updated Packages'}</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {language === 'my' ? 'စီမံခန့်ခွဲသူမှ တင်ထားသော အသစ်စက်စက် APK များ' : 'Latest updates and developer releases'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {newlyUploadedApps.map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={handleSelectApp}
                          onQuickDownload={handleQuickDownload}
                          language={language}
                          isWishlisted={wishlistAppIds.includes(app.id)}
                          onToggleWishlist={toggleWishlist}
                          onOpenQrCode={handleOpenQr}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

          </div>
        )}

        {/* International FAQ Section */}
        <FAQSection
          language={language}
          onOpenContact={() => setIsContactOpen(true)}
          onOpenPolicy={(tab) => setActivePolicyTab(tab)}
        />

      </main>

      {/* Product Detail Modal */}
      <AppDetailModal
        app={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        onStartDownload={(app) => {
          setSelectedApp(null);
          setDownloadingApp(app);
          playDownloadSound();
        }}
        language={language}
        onSelectRelatedApp={handleSelectApp}
        allApps={apps}
        isWishlisted={Boolean(selectedApp && wishlistAppIds.includes(selectedApp.id))}
        onToggleWishlist={toggleWishlist}
        onOpenQrCode={handleOpenQr}
        onOpenSecurityCert={handleOpenSecurityCert}
        onOpenCompare={handleOpenCompare}
      />

      {/* Download Center & Simulation Progress Modal */}
      <DownloadManagerModal
        app={downloadingApp}
        isOpen={Boolean(downloadingApp)}
        onClose={() => setDownloadingApp(null)}
        language={language}
        onDownloadRecorded={handleDownloadRecorded}
      />

      {/* Saved Favorites / Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistApps={wishlistApps}
        onRemove={toggleWishlist}
        onClear={() => {
          setWishlistAppIds([]);
          try {
            localStorage.removeItem('apexapk_wishlist');
          } catch {}
        }}
        onSelectApp={handleSelectApp}
        onStartDownload={(app) => {
          setIsWishlistOpen(false);
          setDownloadingApp(app);
          playDownloadSound();
        }}
        language={language}
      />

      {/* Side-by-Side App Comparison Modal */}
      <AppCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        primaryApp={comparePrimaryApp || apps[0] || null}
        allApps={apps}
        onStartDownload={(app) => {
          setIsCompareOpen(false);
          setDownloadingApp(app);
          playDownloadSound();
        }}
        language={language}
      />

      {/* Phone Scan QR Code Modal */}
      <QrCodeModal
        app={qrApp}
        isOpen={Boolean(qrApp)}
        onClose={() => setQrApp(null)}
        language={language}
      />

      {/* Official Security Verification & SHA-256 Certificate Modal */}
      <SecurityCertModal
        app={securityCertApp}
        isOpen={Boolean(securityCertApp)}
        onClose={() => setSecurityCertApp(null)}
        language={language}
      />

      {/* Official Contact & Customer Support Modal */}
      <ContactSupportModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        language={language}
      />

      {/* Policy & Trust Legal Center Modal */}
      <PolicyModal
        isOpen={Boolean(activePolicyTab)}
        initialTab={activePolicyTab || 'privacy'}
        onClose={() => setActivePolicyTab(null)}
        language={language}
      />

      {/* Floating 24/7 Support Action */}
      <FloatingSupportButton
        onOpenContactModal={() => setIsContactOpen(true)}
        language={language}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* GDPR / Privacy Cookie Consent Banner */}
      <CookieBanner
        language={language}
        onOpenPrivacy={() => setActivePolicyTab('privacy')}
      />

      {/* Comprehensive International Footer */}
      <Footer
        language={language}
        onOpenPolicy={(tab) => setActivePolicyTab(tab)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

    </div>
  );
}
