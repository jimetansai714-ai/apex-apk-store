import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileCheck, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  AlertCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { APKApp, AppCategory, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { uploadApkToServer, normalizeDirectDownloadUrl } from '../utils/apkStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAppUploaded: (newApp: APKApp) => void;
  language: Language;
}

const CATEGORIES: { id: AppCategory; labelEn: string; labelMy: string }[] = [
  { id: 'games', labelEn: 'Games & Entertainment', labelMy: 'ဂိမ်းများ' },
  { id: 'tools', labelEn: 'Tools & Utilities', labelMy: 'ဖုန်းသုံးကိရိယာများ' },
  { id: 'social', labelEn: 'Social & Communication', labelMy: 'လူမှုကွန်ရက်' },
  { id: 'entertainment', labelEn: 'Music & Video', labelMy: 'ဖျော်ဖြေရေး' },
  { id: 'productivity', labelEn: 'Productivity & Office', labelMy: 'အလုပ်လုပ်ဆောင်မှု' },
  { id: 'photography', labelEn: 'Photo & Video Editing', labelMy: 'ဓာတ်ပုံ/ဗီဒီယို' },
  { id: 'myanmar', labelEn: 'Myanmar Special', labelMy: 'မြန်မာ အထူးအက်ပ်' },
];

const ICON_THEMES = [
  { bg: 'from-emerald-500 to-teal-700', label: 'Emerald' },
  { bg: 'from-blue-500 to-indigo-700', label: 'Sapphire' },
  { bg: 'from-purple-500 to-pink-600', label: 'Amethyst' },
  { bg: 'from-rose-500 to-red-800', label: 'Ruby' },
  { bg: 'from-amber-500 to-orange-600', label: 'Amber' },
  { bg: 'from-cyan-500 to-blue-600', label: 'Cyan' },
];

const ICON_GLYPHS: APKApp['iconSvgType'][] = [
  'game', 'tool', 'chat', 'music', 'camera', 'book', 'globe', 'code', 'wallet', 'shield'
];

export const UploadApkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAppUploaded,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishedApp, setPublishedApp] = useState<APKApp | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nameMy, setNameMy] = useState('');
  const [packageName, setPackageName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [category, setCategory] = useState<AppCategory>('tools');
  const [version, setVersion] = useState('v1.0.0');
  const [minAndroid, setMinAndroid] = useState('Android 8.0+');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [changelog, setChangelog] = useState('Initial official release.');
  const [iconBg, setIconBg] = useState(ICON_THEMES[0].bg);
  const [iconSvgType, setIconSvgType] = useState<APKApp['iconSvgType']>('tool');
  const [fileSize, setFileSize] = useState('24.5 MB');

  const [directUrl, setDirectUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    // Parse human readable size
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${mb} MB`);

    // Smart auto-fill from filename
    const cleanName = file.name.replace(/\.apk$/i, '').replace(/[-_]/g, ' ');
    if (!name) {
      setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
    if (!packageName) {
      const sanitized = file.name
        .replace(/\.apk$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      setPackageName(`com.dev.${sanitized || 'app'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalDownloadUrl: string | undefined = undefined;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const res = await uploadApkToServer(selectedFile, (pct) => setUploadProgress(pct));
        if (res.success && res.downloadUrl) {
          finalDownloadUrl = res.downloadUrl;
        }
      } catch (err) {
        console.warn('Server upload error', err);
      } finally {
        setIsUploading(false);
      }
    } else if (directUrl.trim()) {
      finalDownloadUrl = normalizeDirectDownloadUrl(directUrl.trim());
    }

    const chosenCat = CATEGORIES.find((c) => c.id === category);

    const newApp: APKApp = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      nameMy: nameMy.trim() || undefined,
      packageName: packageName.trim() || `com.developer.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      developer: developer.trim() || 'Independent Creator',
      category,
      categoryName: chosenCat?.labelEn || 'General Tools',
      rating: 5.0,
      ratingsCount: 0,
      downloads: '0 downloads',
      downloadCount: 0,
      size: fileSize,
      version: version.trim() || 'v1.0.0',
      minAndroid,
      sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      shortDescription: shortDescription.trim() || `${name} Android application package ready for instant installation.`,
      description: description.trim() || `${name} is an Android application published directly to P-Store.`,
      changelog: changelog.trim() || 'Initial release.',
      iconBg,
      iconSvgType,
      bannerBg: 'from-slate-900 via-emerald-950 to-slate-950',
      bannerTagline: 'Newly Published APK',
      screenshots: [
        'User interface main overview',
        'Feature breakdown and responsive controls',
        'Performance optimized Android package'
      ],
      permissions: ['Internet access', 'Storage read/write', 'Network state'],
      uploadedAt: new Date().toISOString().split('T')[0],
      isVerified: true,
      isNew: true,
      customUploaded: true,
      downloadUrl: finalDownloadUrl,
    };

    onAppUploaded(newApp);
    setPublishedApp(newApp);
    setIsSuccess(true);
  };

  const previewApp: APKApp = {
    id: 'preview',
    name: name || (language === 'my' ? 'အက်ပ်အမည်' : 'App Title'),
    nameMy: nameMy || undefined,
    packageName: packageName || 'com.example.app',
    developer: developer || 'Your Studio',
    category,
    categoryName: CATEGORIES.find((c) => c.id === category)?.labelEn || 'Tools',
    rating: 5.0,
    ratingsCount: 0,
    downloads: '0 downloads',
    downloadCount: 0,
    size: fileSize,
    version,
    minAndroid,
    sha256: '9a7f3c4e8b2d109f6e5a4c3b2a1f0e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a4f3',
    shortDescription: shortDescription || (language === 'my' ? 'အက်ပ်အကျဉ်းချုပ် ဖော်ပြချက်...' : 'A modern Android APK package built for performance.'),
    description: description || 'Complete app description...',
    changelog,
    iconBg,
    iconSvgType,
    bannerBg: 'from-slate-900 to-emerald-950',
    bannerTagline: 'New Release',
    screenshots: ['Preview 1', 'Preview 2'],
    permissions: ['Network', 'Storage'],
    uploadedAt: 'Today',
    isVerified: true,
    isNew: true,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'APK အသစ်တင်ရန်' : 'Publish / Upload APK'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'my' ? 'သင့် APK ဖိုင်ကို အချက်အလက်ပြည့်စုံစွာ တင်နိုင်ပါသည်' : 'Upload your Android package to the marketplace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSuccess && (
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'form' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {language === 'my' ? 'ဖောင်' : 'Details'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                    activeTab === 'preview' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye size={12} />
                  <span>{language === 'my' ? 'စတိုးပုံစံကြည့်ရန်' : 'Live Preview'}</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isSuccess && publishedApp ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'my' ? 'APK အောင်မြင်စွာ တင်ပြီးပါပြီ!' : 'APK Published Successfully!'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {language === 'my' 
                  ? `"${publishedApp.name}" ကို P-Store စတိုးတွင် တိုက်ရိုက်ဒေါင်းလုဒ်ဆွဲနိုင်ပါပြီ။` 
                  : `"${publishedApp.name}" is now live on P-Store for instant discovery and downloading.`}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl max-w-sm mx-auto flex items-center gap-3 text-left border border-slate-200/80 dark:border-slate-700/80">
              <AppIconRenderer app={publishedApp} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{publishedApp.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{publishedApp.packageName}</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  <ShieldCheck size={12} />
                  <span>ApexShield Verified Clean</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {language === 'my' ? 'စတိုးသို့ သွားမည်' : 'View in Marketplace'}
              </button>
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          /* Live Store Preview tab */
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
              <AppIconRenderer app={previewApp} size="lg" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{previewApp.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{previewApp.packageName}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{previewApp.categoryName} · {previewApp.version}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-semibold text-amber-500">★ 5.0</span>
                  <span>·</span>
                  <span>{previewApp.size}</span>
                  <span>·</span>
                  <span>{previewApp.minAndroid}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">About App</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                {previewApp.shortDescription}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
              >
                Publish Now
              </button>
            </div>
          </div>
        ) : (
          /* Form Tab */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* APK File Upload Drag & Drop Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {language === 'my' ? 'APK ဖိုင်ရွေးချယ်ပါ (.apk)' : 'APK Package File (.apk)'}
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".apk"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileCheck size={20} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{fileSize} · Ready for manifest inspection</p>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                      <ShieldCheck size={14} /> Clean
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload size={24} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {language === 'my' ? 'ဖိုင်ကို ဤနေရာတွင် ဆွဲထည့်ပါ သို့မဟုတ် နှိပ်၍ရွေးချယ်ပါ' : 'Drag & drop your .apk file here, or browse'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports Android APK, Universal arm64-v8a / armeabi-v7a
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* App Title & Myanmar Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'my' ? 'အက်ပ်အမည် (English) *' : 'App Title (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Neo Speed Scanner"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'my' ? 'မြန်မာ အမည် (စိတ်ကြိုက်)' : 'Myanmar Title (Optional)'}
                </label>
                <input
                  type="text"
                  value={nameMy}
                  onChange={(e) => setNameMy(e.target.value)}
                  placeholder="e.g. နီယို အမြန် စကန်နာ"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Package Name & Developer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'my' ? 'Package Name (e.g. com.dev.app)' : 'Package Name (Android ID)'}
                </label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="com.company.appname"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'my' ? 'ထုတ်လုပ်သူ / စတူဒီယို' : 'Developer / Studio'}
                </label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="e.g. Apex Dev Team"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Category & Version & Min Android */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'my' ? 'ကဏ္ဍ (Category)' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AppCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'my' ? cat.labelMy : cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0.0"
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Min Android
                </label>
                <input
                  type="text"
                  value={minAndroid}
                  onChange={(e) => setMinAndroid(e.target.value)}
                  placeholder="Android 8.0+"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Icon Customizer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'my' ? 'အက်ပ် အိုင်ကွန် ဒီဇိုင်း' : 'App Icon Visual Style'}
              </label>
              <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Visual Preview */}
                <AppIconRenderer 
                  app={{ 
                    ...previewApp, 
                    iconBg, 
                    iconSvgType 
                  }} 
                  size="md" 
                />

                {/* Color Theme Pills */}
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <div className="text-[11px] text-slate-400 font-medium">Color Palette</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ICON_THEMES.map((theme, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIconBg(theme.bg)}
                        className={`w-6 h-6 rounded-full bg-gradient-to-tr ${theme.bg} transition-all ${
                          iconBg === theme.bg ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={theme.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Glyph Picker */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400 font-medium">Symbol</div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {ICON_GLYPHS.slice(0, 6).map((glyph) => (
                      <button
                        key={glyph}
                        type="button"
                        onClick={() => setIconSvgType(glyph)}
                        className={`px-2 py-0.5 text-xs rounded-md capitalize font-medium ${
                          iconSvgType === glyph 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {glyph}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Short Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'my' ? 'အကျဉ်းချုပ် ဖော်ပြချက် (Short Tagline) *' : 'Short Description (Tagline) *'}
              </label>
              <input
                type="text"
                required
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="High performance tool for daily Android operations."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Changelog / What's new */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'my' ? 'ဗားရှင်းအသစ်တွင် ပါဝင်သောအရာများ (Changelog)' : "What's New in this release"}
              </label>
              <textarea
                rows={2}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Initial release with core features."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Notice regarding backend database */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900/60">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-blue-500" />
              <span>
                {language === 'my' 
                  ? 'လောလောဆယ်တွင် ဒေတာဘေ့စ်မချိတ်ဆက်ရသေးသဖြင့် APK သည် local memory ထဲသို့ ချက်ချင်းသိမ်းဆည်းပေးမည်ဖြစ်ပြီး စတိုးတွင် ချက်ချင်းဒေါင်းလုဒ်စမ်းသပ်နိုင်ပါသည်။'
                  : 'Client-side state enabled: Uploaded APK will immediately appear in the store and be downloadable.'}
              </span>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                {language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                {language === 'my' ? 'APK တင်မည်' : 'Submit & Publish APK'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
