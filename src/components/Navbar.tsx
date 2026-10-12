import React, { useState } from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Languages, 
  X,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Heart,
  ArrowLeftRight,
  Lock
} from 'lucide-react';
import { Language, AppCategory } from '../types';
import { PStoreLogo } from './PStoreLogo';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeNavTab: string;
  onNavTabChange: (tab: string) => void;
  language: Language;
  onToggleLanguage: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  activeCategory: AppCategory;
  onSelectCategory: (cat: AppCategory) => void;
  onOpenContact?: () => void;
  onOpenPolicy?: (tab: any) => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onOpenCompare?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  activeNavTab,
  onNavTabChange,
  language,
  onToggleLanguage,
  isDark,
  onToggleDark,
  onOpenContact,
  onOpenPolicy,
  wishlistCount = 0,
  onOpenWishlist,
  onOpenCompare,
  onOpenAdmin,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavTabChange('apps');
  };

  const t = {
    apps: language === 'my' ? 'အက်ပ်များ' : 'Apps',
    games: language === 'my' ? 'ဂိမ်းများ' : 'Games',
    charts: language === 'my' ? 'ထိပ်တန်းစာရင်း' : 'Top Charts',
    myanmar: language === 'my' ? 'မြန်မာ အက်ပ်' : 'Myanmar',
    searchPlaceholder: language === 'my' ? 'အက်ပ် သို့မဟုတ် ဂိမ်းများကို ရှာဖွေပါ...' : 'Search apps, games, APKs...',
  };

  const navTabs = [
    { id: 'apps', label: t.apps },
    { id: 'games', label: t.games },
    { id: 'charts', label: t.charts },
    { id: 'myanmar', label: t.myanmar },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Wordmark & Navigation */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              onClick={handleLogoClick}
              className="group flex items-center transition-opacity hover:opacity-90 shrink-0"
              title="P-Store"
            >
              <PStoreLogo size="md" />
            </a>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {navTabs.map((tab) => {
                const isActive = activeNavTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavTabChange(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 relative">
            <div className={`relative flex items-center w-full transition-all duration-200 ${
              isSearchFocused 
                ? 'ring-2 ring-emerald-500/30 border-emerald-500' 
                : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}>
              <Search size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-transparent rounded-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Zone 3: Actions (Wishlist, Compare, Support, Language & Dark Mode) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Wishlist / My Collection Button */}
            {onOpenWishlist && (
              <button
                onClick={onOpenWishlist}
                title={language === 'my' ? 'သိမ်းဆည်းထားသော အကြိုက်ဆုံးများ' : 'My Saved Collection'}
                className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 dark:border-slate-800"
              >
                <Heart size={14} className={wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
                <span className="hidden sm:inline">{language === 'my' ? 'အကြိုက်ဆုံး' : 'Saved'}</span>
                {wishlistCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* Compare Apps Button */}
            {onOpenCompare && (
              <button
                onClick={onOpenCompare}
                title={language === 'my' ? 'ဆော့ဖ်ဝဲလ် အချင်းချင်း နှိုင်းယှဉ်ချက်' : 'Compare Apps'}
                className="hidden lg:flex px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 dark:border-slate-800"
              >
                <ArrowLeftRight size={14} className="text-emerald-500" />
                <span>{language === 'my' ? 'နှိုင်းယှဉ်ချက်' : 'Compare'}</span>
              </button>
            )}

            {/* Direct Support Desk Action */}
            {onOpenContact && (
              <button
                onClick={onOpenContact}
                title={language === 'my' ? 'တရားဝင် ဆက်သွယ်ရန်နှင့် အကူအညီ' : 'Official Support & Contact'}
                className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 dark:border-slate-800"
              >
                <MessageSquare size={14} className="text-emerald-500" />
                <span className="hidden md:inline">{language === 'my' ? 'ဆက်သွယ်ရန်' : 'Support'}</span>
              </button>
            )}

            {/* Language switch */}
            <button
              onClick={onToggleLanguage}
              title={language === 'en' ? 'မြန်မာဘာသာသို့ ပြောင်းရန်' : 'Switch to English'}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Languages size={17} />
              <span className="hidden sm:inline">{language === 'en' ? 'မြန်မာ' : 'ENG'}</span>
            </button>

            {/* Dark mode switch */}
            <button
              onClick={onToggleDark}
              aria-label="Toggle theme"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Direct Admin Console Access Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                title={language === 'my' ? 'P-Store Admin စီမံခန့်ခွဲမှု စနစ်သို့ ဝင်မည်' : 'Open P-Store Admin Console'}
                className="ml-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Lock size={13} className="stroke-[2.5]" />
                <span>Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
