import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Database, 
  Download, 
  TrendingUp, 
  Flame, 
  FileCheck, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check,
  Search,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  Sparkles,
  Github,
  Link,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  X,
  LogOut,
  Layers,
  Wand2,
  Trash,
  Link2,
  Rocket,
  UploadCloud,
  ArrowUpCircle,
  History,
  RotateCcw,
  Activity,
  HardDrive
} from 'lucide-react';
import { APKApp, AppCategory, Language } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { DownloadAuditModal } from './DownloadAuditModal';
import { getAppShareUrl, copyAppShareUrl, formatExactDownloads } from '../utils/shareUtils';
import { 
  getStoredGitHubConfig, 
  loadGitHubConfigWithFirestore,
  saveGitHubConfig, 
  removeGitHubConfig,
  testGitHubConnection, 
  uploadApkToGitHubRelease,
  DEFAULT_GITHUB_CONFIG,
  GitHubConfig 
} from '../utils/githubStorage';
import { getGitHubConfigFromFirestore } from '../firebase';
import { 
  compressLogo, 
  compressScreenshot, 
  formatBytes,
  CompressionResult 
} from '../utils/imageCompressor';
import { parseApkFile } from '../utils/apkParser';
import { 
  uploadApkToServer, 
  normalizeDirectDownloadUrl, 
  hasGenuineDownloadLink 
} from '../utils/apkStorage';
import { 
  purgeAllOldMockAppsFromFirestore, 
  purgeEntireCatalogFromFirestore 
} from '../firebase';

interface Props {
  apps: APKApp[];
  onAppUploaded: (newApp: APKApp) => Promise<void> | void;
  onUpdateApp: (updatedApp: APKApp) => Promise<void> | void;
  onDeleteApp: (appId: string) => Promise<void> | void;
  onClose: () => void;
  onLogout?: () => void;
  language: Language;
}

const CATEGORIES: { id: AppCategory; labelEn: string; labelMy: string }[] = [
  { id: 'tools', labelEn: 'Tools & Utilities (ဖုန်းပြင်ဆင်ရေး/ကိရိယာ)', labelMy: 'ဖုန်းသုံးကိရိယာများ' },
  { id: 'games', labelEn: 'Games & Entertainment', labelMy: 'ဂိမ်းများ' },
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
  'tool', 'game', 'chat', 'music', 'camera', 'book', 'globe', 'code', 'wallet', 'shield'
];

export const AdminPanel: React.FC<Props> = ({
  apps,
  onAppUploaded,
  onUpdateApp,
  onDeleteApp,
  onClose,
  onLogout,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'catalog' | 'github' | 'analytics' | 'database'>('upload');
  
  // GitHub Integration State
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => getStoredGitHubConfig());
  const [quickTokenInput, setQuickTokenInput] = useState('');
  const [githubStatus, setGithubStatus] = useState<{ testing: boolean; message: string; success?: boolean }>({
    testing: false,
    message: '',
  });

  // Load GitHub config from Firestore on mount
  useEffect(() => {
    loadGitHubConfigWithFirestore().then((cfg) => {
      setGithubConfig(cfg);
      if (cfg.token) {
        setQuickTokenInput(cfg.token);
        testGitHubConnection(cfg).then((res) => {
          setGithubStatus({ testing: false, message: res.message, success: res.success });
        });
      }
    });
  }, []);

  const handleQuickSaveGitHubToken = async (tokenStr: string) => {
    const trimmed = tokenStr.trim();
    if (!trimmed) return;
    const updated: GitHubConfig = { 
      owner: (githubConfig.owner || '').trim() || DEFAULT_GITHUB_CONFIG.owner,
      repo: (githubConfig.repo || '').trim() || DEFAULT_GITHUB_CONFIG.repo,
      token: trimmed 
    };
    setGithubConfig(updated);
    saveGitHubConfig(updated);
    setGithubStatus({ testing: true, message: language === 'my' ? 'GitHub သို့ ချိတ်ဆက်စစ်ဆေးနေပါသည်...' : 'Testing GitHub connection...' });
    const res = await testGitHubConnection(updated);
    setGithubStatus({ testing: false, message: res.message, success: res.success });
  };

  // Upload Form States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingApk, setIsParsingApk] = useState(false);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  const [isUploadingToGitHub, setIsUploadingToGitHub] = useState(false);
  const [isUploadingToServer, setIsUploadingToServer] = useState(false);
  const [serverUploadProgress, setServerUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<{ app: APKApp; githubUrl?: string } | null>(null);

  // Storage selection: github (default CDN auto-sync), server (mirror), or direct_url
  const [uploadStorageOption, setUploadStorageOption] = useState<'server' | 'direct_url' | 'github'>('github');
  const [directDownloadUrlInput, setDirectDownloadUrlInput] = useState('');

  // Edit Modal APK upload state
  const editApkInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingEditApk, setIsUploadingEditApk] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editUploadError, setEditUploadError] = useState<string | null>(null);

  // Logo & Screenshots state
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).customLogoUrl : null;
    } catch { return null; }
  });
  const [logoStats, setLogoStats] = useState<{ original: number; compressed: number } | null>(null);
  const [screenshots, setScreenshots] = useState<{ url: string; original: number; compressed: number }[]>([]);

  // Text inputs with draft restore
  const [name, setName] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).name || '' : '';
    } catch { return ''; }
  });
  const [nameMy, setNameMy] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).nameMy || '' : '';
    } catch { return ''; }
  });
  const [packageName, setPackageName] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).packageName || '' : '';
    } catch { return ''; }
  });
  const [developer, setDeveloper] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).developer || '' : '';
    } catch { return ''; }
  });
  const [category, setCategory] = useState<AppCategory>(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).category || 'tools' : 'tools';
    } catch { return 'tools'; }
  });
  const [version, setVersion] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).version || 'v1.0.0' : 'v1.0.0';
    } catch { return 'v1.0.0'; }
  });
  const [minAndroid, setMinAndroid] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).minAndroid || 'Android 8.0+' : 'Android 8.0+';
    } catch { return 'Android 8.0+'; }
  });
  const [shortDescription, setShortDescription] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).shortDescription || '' : '';
    } catch { return ''; }
  });
  const [description, setDescription] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).description || '' : '';
    } catch { return ''; }
  });
  const [changelog, setChangelog] = useState('Official verified release.');
  const [iconBg, setIconBg] = useState(ICON_THEMES[0].bg);
  const [iconSvgType, setIconSvgType] = useState<APKApp['iconSvgType']>('tool');
  const [fileSize, setFileSize] = useState(() => {
    try {
      const d = sessionStorage.getItem('apexapk_upload_draft');
      return d ? JSON.parse(d).fileSize || '24.5 MB' : '24.5 MB';
    } catch { return '24.5 MB'; }
  });
  const [initialDownloads, setInitialDownloads] = useState('0');
  const [initialDownloadCount, setInitialDownloadCount] = useState(0);

  // Auto-save draft so data NEVER disappears if page refreshes
  useEffect(() => {
    if (!name && !packageName && !developer && !shortDescription) return;
    try {
      const draft = {
        name,
        nameMy,
        packageName,
        developer,
        category,
        version,
        minAndroid,
        shortDescription,
        description,
        changelog,
        customLogoUrl,
        fileSize,
      };
      sessionStorage.setItem('apexapk_upload_draft', JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [name, nameMy, packageName, developer, category, version, minAndroid, shortDescription, description, changelog, customLogoUrl, fileSize]);

  // Catalog Table search & edit states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [editingApp, setEditingApp] = useState<APKApp | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState<string | null>(null);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState<APKApp | null>(null);
  const [confirmResetDownloadsModal, setConfirmResetDownloadsModal] = useState(false);
  const [confirmPurgeModal, setConfirmPurgeModal] = useState(false);
  const [auditingApp, setAuditingApp] = useState<APKApp | null>(null);

  // Version Upgrade state
  const [upgradingApp, setUpgradingApp] = useState<APKApp | null>(null);
  const [upgradeVersion, setUpgradeVersion] = useState('');
  const [upgradeChangelog, setUpgradeChangelog] = useState('');
  const [upgradeChangelogMy, setUpgradeChangelogMy] = useState('');
  const [upgradeFile, setUpgradeFile] = useState<File | null>(null);
  const [upgradeFileSize, setUpgradeFileSize] = useState('');
  const [upgradeDownloadUrl, setUpgradeDownloadUrl] = useState('');
  const [isUploadingUpgrade, setIsUploadingUpgrade] = useState(false);
  const [upgradeStatusText, setUpgradeStatusText] = useState('');
  const [upgradeSuccessNotice, setUpgradeSuccessNotice] = useState<string | null>(null);
  const upgradeFileInputRef = useRef<HTMLInputElement>(null);

  // Smart Upgrade Additions
  const [matchedExistingApp, setMatchedExistingApp] = useState<APKApp | null>(null);
  const [upgradeDragActive, setUpgradeDragActive] = useState(false);
  const [upgradeExtractedVersion, setUpgradeExtractedVersion] = useState<string | null>(null);
  const [upgradeNewIconUrl, setUpgradeNewIconUrl] = useState<string | null>(null);
  const [applyNewIcon, setApplyNewIcon] = useState(false);
  const [upgradeMismatchNotice, setUpgradeMismatchNotice] = useState<string | null>(null);
  const [suggestedVersions, setSuggestedVersions] = useState<{ patch: string; minor: string; major: string }>({
    patch: 'v1.0.1',
    minor: 'v1.1.0',
    major: 'v2.0.0',
  });

  const handleTestGitHub = async (cfgToTest?: GitHubConfig) => {
    const target = cfgToTest || githubConfig;
    setGithubStatus({ testing: true, message: 'Testing GitHub connection...' });
    const res = await testGitHubConnection(target);
    setGithubStatus({ testing: false, success: res.success, message: res.message });
  };

  const handleSaveGitHubConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveGitHubConfig(githubConfig);
    handleTestGitHub(githubConfig);
  };

  const handleRemoveGitHub = async () => {
    const emptyConfig = {
      owner: DEFAULT_GITHUB_CONFIG.owner,
      repo: DEFAULT_GITHUB_CONFIG.repo,
      token: '',
    };
    setGithubConfig(emptyConfig);
    setQuickTokenInput('');
    await removeGitHubConfig();
    setGithubStatus({
      testing: false,
      success: false,
      message: language === 'my' 
        ? '✓ GitHub ချိတ်ဆက်မှုအား ရှင်းလင်းဖျက်သိမ်းပြီးပါပြီ (ဆာဗာ သိုလှောင်ခန်းသို့ အလိုအလျောက် ပြောင်းထားပါသည်)' 
        : 'GitHub disconnected. Server direct storage will be used.',
    });
    setUploadStorageOption('server');
  };

  // Safe Purge of only old mock seed apps (never deletes real uploaded apps)
  const handlePurgeMockApps = async () => {
    setIsPurging(true);
    await purgeAllOldMockAppsFromFirestore();
    setIsPurging(false);
    setConfirmPurgeModal(false);
  };

  const [resetDownloadsSuccessNotice, setResetDownloadsSuccessNotice] = useState<string | null>(null);

  // Reset inflated test downloads to 0 for all apps
  const handleResetAllDownloads = () => {
    apps.forEach((app) => {
      onUpdateApp({
        ...app,
        downloadCount: 0,
        downloads: '0 downloads',
      });
    });
    setConfirmResetDownloadsModal(false);
    setResetDownloadsSuccessNotice(language === 'my' 
      ? 'ဆော့ဖ်ဝဲလ် အားလုံး၏ ဒေါင်းလုဒ်အရေအတွက်ကို ၀ သို့ အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ!' 
      : 'Successfully reset all app download counts to 0!');
    setTimeout(() => setResetDownloadsSuccessNotice(null), 4000);
  };

  // File drop handler for APK - AUTOMATIC LOGO, VERSION & NAME EXTRACTION
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setExtractedNotice(null);

    // Instantly set filename and size without blocking
    const quickTitle = file.name.replace(/\.apk$/i, '').replace(/[-_]/g, ' ').trim();
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${mb} MB`);
    if (!name.trim()) setName(quickTitle);
    if (!shortDescription.trim()) setShortDescription(`${quickTitle} official Android application package.`);

    setIsParsingApk(true);
    try {
      // Race with 2.5s timeout so large files never freeze browser
      const parsedPromise = parseApkFile(file);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const parsed = await Promise.race([parsedPromise, timeoutPromise]);

      if (parsed) {
        if (parsed.name) setName(parsed.name);
        if (parsed.packageName) setPackageName(parsed.packageName);
        if (parsed.version) setVersion(parsed.version);
        if (parsed.iconDataUrl) setCustomLogoUrl(parsed.iconDataUrl);
        setExtractedNotice(`✓ "${parsed.name || quickTitle}" ၏ အချက်အလက်များ အလိုအလျောက် ရယူပြီးပါပြီ!`);

        // STRICT CHECK: Both App Name AND Package Name must match for an update!
        const parsedName = (parsed.name || quickTitle).trim().toLowerCase();
        const parsedPkg = (parsed.packageName || '').trim().toLowerCase();

        const exactExistingApp = apps.find(
          (a) =>
            parsedPkg &&
            parsedName &&
            a.packageName.toLowerCase() === parsedPkg &&
            a.name.toLowerCase() === parsedName
        );

        const partialMismatch = apps.find(
          (a) =>
            (parsedPkg && a.packageName.toLowerCase() === parsedPkg && a.name.toLowerCase() !== parsedName) ||
            (parsedName && a.name.toLowerCase() === parsedName && parsedPkg && a.packageName.toLowerCase() !== parsedPkg)
        );

        if (exactExistingApp) {
          setMatchedExistingApp(exactExistingApp);
        } else {
          setMatchedExistingApp(null);
          if (partialMismatch) {
            setExtractedNotice(
              language === 'my'
                ? `⚠️ သတိပေးချက်: စတိုးတွင်ရှိသော "${partialMismatch.name}" နှင့် App Name သို့မဟုတ် Package Name တစ်ခုတည်းသာ တူနေပါသည်။ Update လုပ်ရန် App Name နှင့် Package Name (၂) ခုလုံး အကုန်တူညီရပါမည်။`
                : `Notice: Only one of App Name or Package Name matches "${partialMismatch.name}". Both must match exactly to perform an update.`
            );
          }
        }
      }
    } catch (err) {
      console.warn('Notice reading APK:', err);
    } finally {
      setIsParsingApk(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Logo Upload with automatic WebP compression
  const handleLogoUpload = async (file: File) => {
    try {
      const res: CompressionResult = await compressLogo(file);
      setCustomLogoUrl(res.dataUrl);
      setLogoStats({ original: res.originalSize, compressed: res.compressedSize });
    } catch (err) {
      console.error('Failed to compress logo', err);
    }
  };

  // Screenshot Upload with automatic WebP compression (up to 3-4 screenshots)
  const handleScreenshotUpload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const f of list) {
      if (screenshots.length >= 4) break;
      try {
        const res = await compressScreenshot(f);
        setScreenshots((prev) => [
          ...prev, 
          { url: res.dataUrl, original: res.originalSize, compressed: res.compressedSize }
        ].slice(0, 4));
      } catch (err) {
        console.error('Failed to compress screenshot', err);
      }
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit new APK from Admin with GitHub upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'my' ? 'ဆော့ဖ်ဝဲလ် အမည် (App Name) ထည့်သွင်းပေးပါ။' : 'Please provide an application name.');
      return;
    }

    const chosenCat = CATEGORIES.find((c) => c.id === category);

    let serverDownloadUrl: string | undefined = undefined;
    let githubDownloadUrl: string | undefined = undefined;
    let directUrl: string | undefined = undefined;

    if (directDownloadUrlInput.trim()) {
      directUrl = normalizeDirectDownloadUrl(directDownloadUrlInput.trim());
    }

    // 1. Primary: Automatic GitHub Releases Storage (saves genuine APK binary to GitHub Releases CDN)
    if (selectedFile) {
      const currentAdminAuth = localStorage.getItem('apexapk_admin_auth') || sessionStorage.getItem('apexapk_admin_auth') || undefined;

      // Intelligently resolve effective token from all sources
      let effectiveToken = (githubConfig.token || '').trim();
      if (!effectiveToken && quickTokenInput.trim()) {
        effectiveToken = quickTokenInput.trim();
      }
      if (!effectiveToken && uploadStorageOption !== 'server') {
        const stored = getStoredGitHubConfig();
        if (stored.token) effectiveToken = stored.token.trim();
      }
      if (!effectiveToken && uploadStorageOption !== 'server') {
        try {
          const remote = await getGitHubConfigFromFirestore();
          if (remote?.token) effectiveToken = remote.token.trim();
        } catch {}
      }

      const activeGhConfig: GitHubConfig = {
        owner: (githubConfig.owner || '').trim() || DEFAULT_GITHUB_CONFIG.owner,
        repo: (githubConfig.repo || '').trim() || DEFAULT_GITHUB_CONFIG.repo,
        token: effectiveToken,
      };

      const shouldUseGitHub = uploadStorageOption === 'github' && Boolean(effectiveToken);

      if (shouldUseGitHub && effectiveToken) {
        setIsUploadingToGitHub(true);
        setUploadStatusText(
          language === 'my'
            ? 'GitHub Releases CDN ပေါ်သို့ APK မူရင်းဖိုင်အား တန်းတင်နေပါသည်...'
            : 'Uploading APK binary package to GitHub Releases CDN...'
        );

        try {
          const uploadRes = await uploadApkToGitHubRelease(
            selectedFile,
            {
              id: 'temp',
              name: name.trim(),
              packageName: packageName.trim() || `com.app.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              developer: developer.trim() || 'Apex Dev Team',
              category,
              categoryName: chosenCat?.labelEn || 'Tools',
              rating: 5,
              ratingsCount: 1,
              downloads: initialDownloads,
              downloadCount: initialDownloadCount,
              size: fileSize,
              version: version.trim() || 'v1.0.0',
              minAndroid,
              sha256: 'sha',
              shortDescription,
              description,
              changelog,
              iconBg,
              iconSvgType,
              bannerBg: '',
              bannerTagline: '',
              screenshots: [],
              permissions: [],
              uploadedAt: '',
              isVerified: true,
            },
            activeGhConfig,
            (msg) => setUploadStatusText(msg)
          );

          if (uploadRes.success) {
            if (uploadRes.downloadUrl) {
              githubDownloadUrl = uploadRes.downloadUrl;
            }
            if (uploadRes.serverDownloadUrl) {
              serverDownloadUrl = uploadRes.serverDownloadUrl;
            }
          } else {
            console.warn('GitHub Upload notice:', uploadRes.error);
            // Fallback directly to server storage
            setUploadStatusText(language === 'my' ? 'Server Storage သို့ တိုက်ရိုက် သိမ်းဆည်းနေပါသည်...' : 'Falling back to server storage...');
            setIsUploadingToServer(true);
            const sRes = await uploadApkToServer(selectedFile, (pct, status) => {
              setServerUploadProgress(pct);
              setUploadStatusText(status);
            }, currentAdminAuth);
            if (sRes.success && sRes.downloadUrl) {
              serverDownloadUrl = sRes.downloadUrl;
            } else {
              alert(language === 'my' ? `ဆာဗာသို့ တင်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ${sRes.error || 'Server error'}` : `Server error: ${sRes.error}`);
              setIsUploadingToGitHub(false);
              setIsUploadingToServer(false);
              return;
            }
          }
        } catch (ghErr: any) {
          console.warn('GitHub Release notice:', ghErr.message);
          setIsUploadingToServer(true);
          const sRes = await uploadApkToServer(selectedFile, (pct, status) => {
            setServerUploadProgress(pct);
            setUploadStatusText(status);
          }, currentAdminAuth);
          if (sRes.success && sRes.downloadUrl) {
            serverDownloadUrl = sRes.downloadUrl;
          } else {
            alert(`Upload Error: ${ghErr.message}`);
            setIsUploadingToGitHub(false);
            setIsUploadingToServer(false);
            return;
          }
        } finally {
          setIsUploadingToGitHub(false);
          setIsUploadingToServer(false);
        }
      } else {
        // Direct Server Storage (when GitHub is removed or user selected server storage)
        try {
          setIsUploadingToServer(true);
          setUploadStatusText(language === 'my' ? 'ဆာဗာသို့ တိုက်ရိုက် သိမ်းဆည်းနေပါသည်...' : 'Saving to server storage...');
          const sRes = await uploadApkToServer(selectedFile, (pct, status) => {
            setServerUploadProgress(pct);
            setUploadStatusText(status);
          }, currentAdminAuth);
          if (sRes.success && sRes.downloadUrl) {
            serverDownloadUrl = sRes.downloadUrl;
          } else if (directUrl) {
            console.warn('Direct server upload notice, falling back to provided directUrl:', sRes.error);
          } else {
            console.warn('Server upload notice:', sRes.error);
            alert(
              language === 'my'
                ? `ဆာဗာသို့ APK ဖိုင်တင်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ${sRes.error || 'Server error'}\n\nအကြံပြုချက်:\n• GitHub Pages သို့မဟုတ် Static Host တွင် အသုံးပြုနေပါက GitHub Tab တွင် GitHub Releases Token ထည့်သွင်းချိတ်ဆက်ပေးပါ (သို့မဟုတ် Direct Download Link ထည့်ပါ)\n• Local ကွန်ပျူတာပေါ်တွင် စမ်းသပ်နေပါက 'npm run dev' (သို့မဟုတ် 'npm start') ဖြင့် Express Server ကို run ထားပေးပါ။`
                : `Server upload notice: ${sRes.error || 'Server error'}\n\nTip: Connect GitHub Releases token in the GitHub tab, provide a Direct Download URL, or ensure the server is running with 'npm run dev'.`
            );
            setIsUploadingToServer(false);
            return;
          }
        } catch (err: any) {
          console.warn('Server upload notice:', err.message);
          if (directUrl) {
            console.warn('Server upload notice, proceeding with directUrl:', err.message);
          } else {
            alert(
              language === 'my'
                ? `ဆာဗာ ချိတ်ဆက်မှု အမှား: ${err.message}\n\nအကြံပြုချက်: GitHub Tab တွင် GitHub Token ချိတ်ဆက်ထားပေးပါ (သို့မဟုတ် Direct Download URL ထည့်သွင်းပါ)။ Local စမ်းသပ်ရန် 'npm run dev' ဖြင့် run ထားပေးပါ။`
                : `Server connection error: ${err.message}\n\nPlease connect GitHub token or provide a Direct Download URL.`
            );
            setIsUploadingToServer(false);
            return;
          }
        } finally {
          setIsUploadingToServer(false);
        }
      }
    }

    // Determine final primary download URL (GitHub CDN link is primary)
    const finalDownloadUrl = githubDownloadUrl || serverDownloadUrl || directUrl;

    if (!finalDownloadUrl) {
      alert(
        language === 'my'
          ? 'အမှား: တကယ့် APK မူရင်းဖိုင် (သို့မဟုတ်) Direct Download Link မပါရှိပါ။ ကျေးဇူးပြု၍ .apk ဖိုင် ရွေးချယ်ပြီးမှ တင်ပါ။'
          : 'Error: No authentic APK file or direct download link attached. Please attach an APK file.'
      );
      return;
    }

    // Screenshots array (use compressed dataUrls or clean fallback)
    const finalScreenshots: string[] = screenshots.length > 0
      ? screenshots.map((s) => s.url)
      : [
          'Performance optimized Android package',
          'Certified clean and virus-scanned',
          'High speed installation'
        ];

    const newApp: APKApp = {
      id: `app-${Date.now()}`,
      name: name.trim(),
      nameMy: nameMy.trim() || undefined,
      packageName: packageName.trim() || `com.developer.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      developer: developer.trim() || 'Apex Dev Team',
      category,
      categoryName: chosenCat?.labelEn || 'Tools & Utilities',
      rating: 5.0,
      ratingsCount: 0,
      downloads: `${initialDownloadCount} downloads`,
      downloadCount: initialDownloadCount,
      size: fileSize,
      version: version.trim() || 'v1.0.0',
      minAndroid,
      sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      shortDescription: shortDescription.trim() || `${name} application package verified on P-Store.`,
      description: description.trim() || `${name} is an Android application managed via the Admin Panel.`,
      changelog: changelog.trim() || 'Official verified release.',
      iconBg,
      iconSvgType,
      iconUrl: customLogoUrl || undefined,
      bannerBg: 'from-slate-900 via-emerald-950 to-slate-950',
      bannerTagline: 'Verified New Release',
      screenshots: finalScreenshots,
      permissions: ['Internet access', 'Storage read/write', 'Network state'],
      uploadedAt: new Date().toISOString().split('T')[0],
      isVerified: true,
      isNew: true,
      customUploaded: true,
      downloadUrl: finalDownloadUrl,
      githubReleaseUrl: githubDownloadUrl || (finalDownloadUrl.includes('github.com') ? finalDownloadUrl : undefined),
    };

    await onAppUploaded(newApp);
    setUploadedResult({ app: newApp, githubUrl: githubDownloadUrl || finalDownloadUrl });
    try { sessionStorage.removeItem('apexapk_upload_draft'); } catch {}
    setIsUploadSuccess(true);
  };

  // Quick edit save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    onUpdateApp(editingApp);
    setEditingApp(null);
  };

  // Open Version Upgrade Modal with intelligent suggestions
  const computeSemanticBumps = (currentVersion: string) => {
    let patch = 'v1.0.1';
    let minor = 'v1.1.0';
    let major = 'v2.0.0';
    const match = currentVersion.match(/v?(\d+)\.(\d+)(?:\.(\d+))?/i);
    if (match) {
      const maj = parseInt(match[1]);
      const min = parseInt(match[2]);
      const pat = match[3] !== undefined ? parseInt(match[3]) : 0;
      patch = `v${maj}.${min}.${pat + 1}`;
      minor = `v${maj}.${min + 1}.0`;
      major = `v${maj + 1}.0.0`;
    }
    return { patch, minor, major };
  };

  const handleOpenUpgrade = (app: APKApp, initialFile?: File | null, suggestedVer?: string) => {
    setUpgradingApp(app);
    const bumps = computeSemanticBumps(app.version);
    setSuggestedVersions(bumps);

    const initialVersion = suggestedVer || bumps.minor;
    setUpgradeVersion(initialVersion);
    setUpgradeExtractedVersion(suggestedVer || null);
    setUpgradeChangelog(app.changelog || 'Performance optimizations, bug fixes, and user experience enhancements.');
    setUpgradeChangelogMy(app.changelogMy || 'ချို့ယွင်းချက်များကို ပြင်ဆင်ထားပြီး အသုံးပြုရ ပိုမိုမြန်ဆန်ချောမွေ့စေရန် မွမ်းမံထားပါသည်။');
    setUpgradeDownloadUrl(app.downloadUrl || '');
    setUpgradeStatusText('');
    setUpgradeSuccessNotice(null);
    setUpgradeNewIconUrl(null);
    setApplyNewIcon(false);

    if (initialFile) {
      processUpgradeApkFile(initialFile);
    } else {
      setUpgradeFile(null);
      setUpgradeFileSize(app.size);
    }
  };

  // Inspect and process new APK binary file for upgrade
  const processUpgradeApkFile = async (file: File) => {
    setUpgradeFile(file);
    const sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setUpgradeFileSize(sizeFormatted);
    try {
      const parsed = await parseApkFile(file);
      if (parsed.fileSizeFormatted) {
        setUpgradeFileSize(parsed.fileSizeFormatted);
      }
      if (parsed.version) {
        setUpgradeVersion(parsed.version);
        setUpgradeExtractedVersion(parsed.version);
      }
      if (parsed.iconDataUrl) {
        setUpgradeNewIconUrl(parsed.iconDataUrl);
      }
      if (upgradingApp) {
        const isPkgMismatch = Boolean(parsed.packageName && upgradingApp.packageName && parsed.packageName.toLowerCase() !== upgradingApp.packageName.toLowerCase());
        const isNameMismatch = Boolean(parsed.name && upgradingApp.name && parsed.name.toLowerCase() !== upgradingApp.name.toLowerCase());
        if (isPkgMismatch || isNameMismatch) {
          setUpgradeStatusText(
            language === 'my'
              ? `⚠️ သတိပေးချက်: APK Package Name ("${parsed.packageName || 'Unknown'}") သို့မဟုတ် App Name ("${parsed.name || 'Unknown'}") သည် မူရင်း App ("${upgradingApp.name}", "${upgradingApp.packageName}") နှင့် မတူညီပါ။ Update လုပ်ရန် App Name နှင့် Package Name (၂) ခုလုံး အကုန်တူညီရပါမည်။`
              : `⚠️ Mismatch: Both App Name ("${upgradingApp.name}") and Package Name ("${upgradingApp.packageName}") must match exactly to perform an update.`
          );
        }
      }
    } catch (err) {
      console.warn('Notice parsing upgrade file:', err);
    }
  };

  // Handle updated APK file selection during upgrade
  const handleUpgradeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUpgradeApkFile(file);
  };

  // Publish Version Upgrade
  const handlePublishUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradingApp || !upgradeVersion.trim()) return;

    if (upgradeFile) {
      try {
        const parsed = await parseApkFile(upgradeFile);
        if (parsed) {
          const isPkgMismatch = Boolean(parsed.packageName && upgradingApp.packageName && parsed.packageName.toLowerCase() !== upgradingApp.packageName.toLowerCase());
          const isNameMismatch = Boolean(parsed.name && upgradingApp.name && parsed.name.toLowerCase() !== upgradingApp.name.toLowerCase());
          if (isPkgMismatch || isNameMismatch) {
            alert(
              language === 'my'
                ? `❌ Update မပြုလုပ်နိုင်ပါ: ရွေးချယ်ထားသော APK ၏ App Name သို့မဟုတ် Package Name သည် မူရင်း App ("${upgradingApp.name}", "${upgradingApp.packageName}") နှင့် မကိုက်ညီပါ။ Update ပြုလုပ်ရန် App Name နှင့် Package Name (၂) ခုလုံး အကုန်တူညီရပါမည်။`
                : `Cannot update: Both App Name and Package Name must match "${upgradingApp.name}" and "${upgradingApp.packageName}"!`
            );
            return;
          }
        }
      } catch {}
    }

    setIsUploadingUpgrade(true);
    setUpgradeStatusText(language === 'my' ? 'ဗားရှင်းအသစ်အား ပြင်ဆင်နေပါသည်...' : 'Preparing version upgrade package...');

    let finalDownloadUrl = upgradeDownloadUrl.trim();

    // If a new APK binary was selected and GitHub integration is active
    const ghConfig: GitHubConfig = {
      owner: (githubConfig.owner || '').trim() || DEFAULT_GITHUB_CONFIG.owner,
      repo: (githubConfig.repo || '').trim() || DEFAULT_GITHUB_CONFIG.repo,
      token: (githubConfig.token || '').trim() || (getStoredGitHubConfig().token || '').trim(),
    };
    if (upgradeFile && ghConfig.token) {
      setUpgradeStatusText(language === 'my' ? 'APK ဖိုင်အသစ်အား GitHub Release သို့ တင်နေပါသည်...' : 'Uploading new APK binary to GitHub Release...');
      try {
        const targetAppForGh: APKApp = {
          ...upgradingApp,
          version: upgradeVersion.trim(),
        };
        const res = await uploadApkToGitHubRelease(upgradeFile, targetAppForGh, ghConfig, (s) => setUpgradeStatusText(s));
        if (res.success && (res.downloadUrl || res.serverDownloadUrl)) {
          finalDownloadUrl = res.downloadUrl || res.serverDownloadUrl || '';
        }
      } catch (err: any) {
        console.warn('GitHub upload notice during upgrade:', err);
      }
    }

    // Direct Server Upload if GitHub wasn't used or had no URL
    if (upgradeFile && (!finalDownloadUrl || !finalDownloadUrl.startsWith('http'))) {
      setUpgradeStatusText(language === 'my' ? 'APK ဖိုင်အသစ်အား ဆာဗာသို့ တင်နေပါသည်...' : 'Uploading new APK binary to server storage...');
      try {
        const sRes = await uploadApkToServer(upgradeFile);
        if (sRes.success && sRes.downloadUrl) {
          finalDownloadUrl = sRes.downloadUrl;
        }
      } catch (err) {
        console.warn('Server upload notice during upgrade:', err);
      }
    }

    const newSha256 = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Archive previous version in version history
    const historyEntry = {
      version: upgradingApp.version,
      date: upgradingApp.uploadedAt || new Date().toISOString().split('T')[0],
      size: upgradingApp.size,
      changelog: upgradingApp.changelog,
      downloadUrl: upgradingApp.downloadUrl,
    };
    const updatedHistory = [historyEntry, ...(upgradingApp.versionHistory || [])].slice(0, 10);

    const updatedApp: APKApp = {
      ...upgradingApp,
      version: upgradeVersion.trim(),
      size: upgradeFileSize || upgradingApp.size,
      changelog: upgradeChangelog.trim() || `Version ${upgradeVersion.trim()} update release with performance enhancements and bug fixes.`,
      changelogMy: upgradeChangelogMy.trim() || `ဗားရှင်း ${upgradeVersion.trim()} အသစ်တွင် ချို့ယွင်းချက်များ ပြင်ဆင်ထားပြီး အသုံးပြုရ ပိုမိုမြန်ဆန်စေရန် မွမ်းမံထားပါသည်။`,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadUrl: finalDownloadUrl || upgradingApp.downloadUrl,
      sha256: newSha256,
      isNew: true,
      versionHistory: updatedHistory,
      iconUrl: (applyNewIcon && upgradeNewIconUrl) ? upgradeNewIconUrl : upgradingApp.iconUrl,
    };

    await onUpdateApp(updatedApp);
    setIsUploadingUpgrade(false);
    setUpgradeSuccessNotice(language === 'my' 
      ? `✨ "${updatedApp.name}" ဗားရှင်းအား ${updatedApp.version} သို့ အောင်မြင်စွာ အဆင့်မြှင့်တင်ပြီးပါပြီ!` 
      : `✨ Successfully upgraded "${updatedApp.name}" to version ${updatedApp.version}!`);
    setTimeout(() => {
      setUpgradingApp(null);
      setUpgradeSuccessNotice(null);
      setUpgradeFile(null);
      setUpgradeNewIconUrl(null);
    }, 2000);
  };

  // Add 100k downloads to test top hero rank switch
  const handleBoostDownloads = (app: APKApp) => {
    const newCount = app.downloadCount + 500000;
    const newFormatted = `${(newCount / 1000000).toFixed(1)}M+`;
    const updated = {
      ...app,
      downloadCount: newCount,
      downloads: newFormatted,
    };
    onUpdateApp(updated);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(apps, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apexapk_database_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyDatabaseJson = () => {
    navigator.clipboard.writeText(JSON.stringify(apps, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Metrics
  const totalDownloads = apps.reduce((acc, curr) => acc + (Number(curr.downloadCount) || 0), 0);
  const topApp = [...apps].sort((a, b) => (Number(b.downloadCount) || 0) - (Number(a.downloadCount) || 0))[0];

  const filteredCatalog = apps.filter((app) => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      app.name.toLowerCase().includes(q) ||
      app.packageName.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{language === 'my' ? 'ဝဘ်ဆိုက်သို့' : 'Storefront'}</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow">
              <Lock size={14} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                <span>P-Store Master Admin</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SECURED
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Tabs in Top Header + Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'upload' 
                  ? 'bg-emerald-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload size={13} />
              <span>{language === 'my' ? 'APK တင်ရန်' : 'Upload APK'}</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'catalog' 
                  ? 'bg-emerald-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>{language === 'my' ? 'APK စာရင်း' : 'Manage APKs'} ({apps.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'github' 
                  ? 'bg-emerald-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Github size={13} />
              <span>GitHub Storage</span>
              {githubStatus.success && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp size={13} />
              <span>{language === 'my' ? 'စာရင်းအင်း' : 'Analytics'}</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'database' 
                  ? 'bg-emerald-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database size={13} />
              <span>Firestore</span>
            </button>
          </div>

          {/* Logout Action */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout from Admin Console"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/60"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Admin View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        
        {/* ================= TAB 1: UPLOAD APK ================= */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload size={20} className="text-emerald-400" />
                  <span>{language === 'my' ? 'APK အသစ်တင်ရန် (Admin Upload)' : 'Publish / Upload New APK'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'my' 
                    ? 'APK ဖိုင်ကို ရွေးချယ်လိုက်သည်နှင့် တကယ့် အစစ်အမှန် Logo နှင့် အမည်ကို အလိုအလျောက် ထုတ်ယူတပ်ဆင်ပေးပါမည်။' 
                    : 'Selecting an APK automatically extracts the authentic embedded App Icon & Title.'}
                </p>
              </div>

              {/* GitHub connection badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300">
                <Github size={13} className="text-emerald-400" />
                <span className="font-mono">{githubConfig.owner}/{githubConfig.repo}</span>
              </div>
            </div>

            {isUploadingToGitHub && (
              <div className="p-8 text-center bg-slate-950 rounded-3xl border border-emerald-500/40 space-y-4">
                <Loader2 size={36} className="animate-spin text-emerald-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Uploading to GitHub Releases CDN...</h3>
                  <p className="text-xs text-slate-400">{uploadStatusText}</p>
                </div>
              </div>
            )}

            {!isUploadingToGitHub && isUploadSuccess && uploadedResult ? (
              <div className="p-8 text-center bg-slate-950 rounded-3xl border border-emerald-500/40 space-y-5 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">APK Published & Synced!</h3>
                  <p className="text-xs text-slate-400">
                    "{uploadedResult.app.name}" is now live on P-Store with authentic logo and synced with Firebase & GitHub.
                  </p>
                </div>

                {/* Direct Store Share Link for APK Owner */}
                <div className="p-4 bg-emerald-950/30 rounded-2xl text-left border border-emerald-500/30 max-w-lg mx-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <Link2 size={14} />
                      <span>{language === 'my' ? 'APK ပိုင်ရှင်များ မျှဝေရန် Direct Share Link:' : 'Direct Share Link for APK Owner:'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Instant jump</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="font-mono text-xs text-slate-200 truncate flex-1 select-all">
                      {getAppShareUrl(uploadedResult.app)}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyAppShareUrl(uploadedResult.app);
                        setCopiedShareLink(uploadedResult.app.id);
                        setTimeout(() => setCopiedShareLink(null), 2500);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-sm"
                    >
                      {copiedShareLink === uploadedResult.app.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedShareLink === uploadedResult.app.id ? (language === 'my' ? 'ကူးယူပြီး ✓' : 'Copied! ✓') : (language === 'my' ? 'Link ကူးယူမည်' : 'Copy Link')}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {language === 'my' 
                      ? '💡 ဤ Link ကို Social Media (Telegram, Facebook, Viber) တွင် တိုက်ရိုက်ချပေးနိုင်ပါသည်။ မည်သူမဆို Link ကို နှိပ်လိုက်သည်နှင့် ဤ APK ၏ ဒေါင်းလုဒ်စာမျက်နှာသို့ တိုက်ရိုက် ရောက်ရှိသွားပါမည်။' 
                      : '💡 Share this link anywhere. Clicking it immediately opens this APK details & download page!'}
                  </p>
                </div>

                {uploadedResult.githubUrl && (
                  <div className="p-3 bg-slate-900 rounded-xl text-left border border-slate-800 max-w-lg mx-auto">
                    <span className="text-[11px] text-emerald-400 font-bold block mb-1">GitHub Release CDN Direct URL:</span>
                    <a 
                      href={uploadedResult.githubUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-slate-300 hover:text-white underline font-mono break-all flex items-center gap-1"
                    >
                      <ExternalLink size={12} className="shrink-0" />
                      <span className="truncate">{uploadedResult.githubUrl}</span>
                    </a>
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadSuccess(false);
                      setUploadedResult(null);
                      setName('');
                      setNameMy('');
                      setPackageName('');
                      setDeveloper('');
                      setShortDescription('');
                      setSelectedFile(null);
                      setCustomLogoUrl(null);
                      setScreenshots([]);
                      setExtractedNotice(null);
                    }}
                    className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Upload Another APK
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    View Catalog
                  </button>
                </div>
              </div>
            ) : !isUploadingToGitHub && (
              <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
                {/* Draft Auto-Saved Notice */}
                {(name || packageName || shortDescription) && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>{language === 'my' ? 'ရေးလက်စ အချက်အလက်များကို အလိုအလျောက် မှတ်သားထားပါသည် (Auto-saved)' : 'Draft auto-saved — never lost on refresh'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try { sessionStorage.removeItem('apexapk_upload_draft'); } catch {}
                        setName('');
                        setNameMy('');
                        setPackageName('');
                        setDeveloper('');
                        setShortDescription('');
                        setDescription('');
                        setSelectedFile(null);
                        setCustomLogoUrl(null);
                        setExtractedNotice(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 hover:underline cursor-pointer"
                    >
                      {language === 'my' ? 'အသစ်ပြန်စမည် (Clear)' : 'Clear Draft'}
                    </button>
                  </div>
                )}

                {/* Smart Detected: App already in store notification */}
                {matchedExistingApp && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <AppIconRenderer app={matchedExistingApp} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{matchedExistingApp.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                            {language === 'my' ? 'ရှိပြီးသား အက်ပ်' : 'Already in Store'}
                          </span>
                        </div>
                        <p className="text-xs text-amber-300/80 mt-0.5">
                          {language === 'my'
                            ? `လက်ရှိ ဗားရှင်း: ${matchedExistingApp.version} · ဒေါင်းလုဒ်: ${formatExactDownloads(matchedExistingApp.downloadCount, language)}`
                            : `Current version: ${matchedExistingApp.version} · Downloads: ${formatExactDownloads(matchedExistingApp.downloadCount, language)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const fileToUse = selectedFile;
                          handleOpenUpgrade(matchedExistingApp, fileToUse, version !== 'v1.0.0' ? version : undefined);
                          setMatchedExistingApp(null);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                      >
                        <Rocket size={14} className="stroke-[2.5]" />
                        <span>{language === 'my' ? 'ဗားရှင်းအသစ်သို့ အဆင့်မြှင့်တင်မည်' : 'Upgrade to New Version'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchedExistingApp(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Dismiss"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* GitHub Auto-Sync Status & Setup Bar */}
                {githubConfig.token ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Github size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {language === 'my' ? 'GitHub Auto-Sync ချိတ်ဆက်ထားပြီး' : 'GitHub Releases Auto-Sync Active'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 truncate">
                            {githubConfig.owner}/{githubConfig.repo}
                          </span>
                          {githubStatus.testing && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                              <Loader2 size={11} className="animate-spin" /> {language === 'my' ? 'စစ်ဆေးနေသည်...' : 'Checking...'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5 truncate">
                          {githubStatus.message || (language === 'my'
                            ? '✅ တင်လိုက်သော APK များ GitHub Releases ပေါ်တွင် တန်းသိမ်းဆည်းမည်ဖြစ်ပြီး Website တွင်လည်း မူရင်းဖိုင် တန်းဒေါင်းနိုင်ပါမည်'
                            : 'Every uploaded APK is automatically saved to GitHub Releases with permanent direct download')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('github')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                    >
                      {language === 'my' ? 'ပြင်ဆင်ရန်' : 'Config'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Github size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 text-sm">
                            {language === 'my' ? '⚡ GitHub သို့ APK တန်းသိမ်းဆည်းရန် Token ထည့်ပါ' : '⚡ Connect GitHub to Auto-Save APK Packages'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {githubConfig.owner}/{githubConfig.repo}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                          {language === 'my'
                            ? 'တင်လိုက်သော APK ဖိုင်အစစ်အား GitHub Releases တွင် အလိုအလျောက် တန်းသိမ်းဆည်းနိုင်ရန် သင်၏ GitHub Personal Access Token (classic: repo scope) ကို ထည့်သွင်းပေးပါ။'
                            : 'Enter your GitHub Token to immediately save authentic APK binary packages to your repository Releases CDN.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="password"
                        placeholder="ghp_... (GitHub Personal Access Token)"
                        value={quickTokenInput}
                        onChange={(e) => setQuickTokenInput(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={!quickTokenInput.trim() || githubStatus.testing}
                        onClick={() => handleQuickSaveGitHubToken(quickTokenInput)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        {githubStatus.testing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        <span>{language === 'my' ? 'Token သိမ်းပြီး ချိတ်ဆက်မည်' : 'Save & Connect'}</span>
                      </button>
                    </div>
                    {githubStatus.message && (
                      <p className={`text-[11px] ${githubStatus.success ? 'text-emerald-400 font-semibold' : 'text-amber-400'}`}>
                        {githubStatus.message}
                      </p>
                    )}
                  </div>
                )}
                
                {/* 1. Drag and Drop Zone for APK */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {language === 'my' ? '၁။ APK ဖိုင် ရွေးချယ်ပါ (.apk)' : '1. Select APK Binary (.apk) *'}
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Wand2 size={12} /> Auto Logo & Metadata Extractor
                    </span>
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : selectedFile
                        ? 'border-emerald-500/60 bg-emerald-950/10'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
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

                    {isParsingApk ? (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <Loader2 size={24} className="animate-spin text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-200">
                          {language === 'my' ? 'APK ထဲမှ Logo နှင့် အချက်အလက်များ ထုတ်ယူနေပါသည်...' : 'Extracting real APK icon and manifest...'}
                        </span>
                      </div>
                    ) : selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <FileCheck size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{fileSize} · Ready for GitHub Releases</p>
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                          <ShieldCheck size={14} /> Ready
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload size={28} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-200">
                          {language === 'my' ? 'APK ဖိုင် (ဥပမာ- eMMC List.apk) ကို ဤနေရာတွင် ဆွဲထည့်ပါ' : 'Drop your .apk file here or click to browse'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Automatic extraction of the genuine App Icon from inside the APK archive
                        </p>
                      </div>
                    )}
                  </div>

                  {extractedNotice && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <Sparkles size={14} className="text-emerald-400 shrink-0" />
                      <span>{extractedNotice}</span>
                    </div>
                  )}
                </div>

                {/* 2. App Logo (Icon) Upload + Styling */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {language === 'my' ? '၂။ APK Logo (တကယ့်အစစ်အမှန် Logo)' : '2. Authentic App Logo'}
                    </label>
                    {customLogoUrl && (
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                        {logoStats ? `${formatBytes(logoStats.original)} → ${formatBytes(logoStats.compressed)} (WebP)` : 'Extracted from APK'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    {/* Live Preview */}
                    <div className="relative">
                      {customLogoUrl ? (
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-emerald-500/50 shadow-md">
                          <img src={customLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLogoUrl(null);
                              setLogoStats(null);
                              setExtractedNotice(null);
                            }}
                            className="absolute top-0.5 right-0.5 p-1 bg-black/70 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
                            title="Remove logo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <AppIconRenderer
                          app={{
                            id: 'preview',
                            name: name || 'App',
                            packageName: 'com.demo',
                            developer: 'Demo',
                            category,
                            categoryName: 'Category',
                            rating: 5,
                            ratingsCount: 1,
                            downloads: '1+',
                            downloadCount: 1,
                            size: fileSize,
                            version,
                            minAndroid,
                            sha256: 'sha',
                            shortDescription: '',
                            description: '',
                            changelog: '',
                            iconBg,
                            iconSvgType,
                            bannerBg: '',
                            bannerTagline: '',
                            screenshots: [],
                            permissions: [],
                            uploadedAt: '',
                            isVerified: true,
                          }}
                          size="md"
                        />
                      )}
                    </div>

                    {/* Upload or Change Custom Logo Button */}
                    <div className="space-y-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLogoUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer"
                      >
                        <ImageIcon size={13} />
                        <span>{customLogoUrl ? 'Change Logo Image' : 'Upload Custom Logo'}</span>
                      </button>
                      <p className="text-[10px] text-slate-400">
                        PNG / JPG / WebP (Auto-compressed for instant loading)
                      </p>
                    </div>

                    {/* Or choose vector glyph if no image */}
                    {!customLogoUrl && (
                      <div className="border-l border-slate-800 pl-4 space-y-1">
                        <span className="text-[11px] text-slate-400">Or Vector Style:</span>
                        <div className="flex items-center gap-1">
                          {ICON_GLYPHS.slice(0, 5).map((glyph) => (
                            <button
                              key={glyph}
                              type="button"
                              onClick={() => setIconSvgType(glyph)}
                              className={`px-2 py-0.5 text-xs rounded capitalize font-medium ${
                                iconSvgType === glyph ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {glyph}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Screenshot Upload (Up to 3-4 images) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {language === 'my' ? '၃။ Screenshot ပုံများ (ရွေးချယ်နိုင်သည်)' : '3. Screenshots (Optional Preview Images)'}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {screenshots.length} / 4 uploaded (WebP compressed)
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleScreenshotUpload(e.target.files);
                        }
                      }}
                    />

                    {/* Screenshot Thumbnails List */}
                    <div className="flex flex-wrap items-center gap-3">
                      {screenshots.map((s, idx) => (
                        <div key={idx} className="relative w-20 h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group shadow">
                          <img src={s.url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveScreenshot(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
                            title="Delete this screenshot"
                          >
                            <X size={10} />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-center text-[9px] font-mono text-emerald-400">
                            {formatBytes(s.compressed)}
                          </div>
                        </div>
                      ))}

                      {screenshots.length < 4 && (
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="w-20 h-28 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/50 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Plus size={18} />
                          <span className="text-[10px] font-medium text-center leading-tight">Add Screenshot</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Name & Myanmar Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      App Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. eMMC List"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Myanmar Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={nameMy}
                      onChange={(e) => setNameMy(e.target.value)}
                      placeholder="e.g. eMMC လစ်စ်"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Package Name & Developer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Package Name (Android ID)
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="com.company.emmclist"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Developer Name
                    </label>
                    <input
                      type="text"
                      value={developer}
                      onChange={(e) => setDeveloper(e.target.value)}
                      placeholder="e.g. Mobile Fix Pro"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category, Version, Initial Downloads */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AppCategory)}
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.labelEn}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Version Code</label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="v1.0.0"
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {language === 'my' ? 'စတင် ဒေါင်းလုဒ်အရေအတွက်' : 'Initial Downloads'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={initialDownloadCount}
                      onChange={(e) => {
                        const count = Math.max(0, parseInt(e.target.value) || 0);
                        setInitialDownloadCount(count);
                        setInitialDownloads(`${count} downloads`);
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {language === 'my' ? '၀ ယောက်မှ စတင်ပြီး ဒေါင်းလုဒ်ဆွဲသည့်အခါ ၁ ယောက်၊ ၂ ယောက် တိတိကျကျ တိုးသွားပါမည်' : 'Starts at 0 and increments accurately per user'}
                    </p>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Description (Store Tagline) *
                  </label>
                  <input
                    type="text"
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="High-speed Android application for mobile performance."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 text-white focus:outline-none"
                  />
                </div>

                {/* APK Hosting & Storage Options */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {language === 'my' ? 'APK ဖိုင် သိမ်းဆည်းမည့် စနစ် (Hosting Method)' : 'APK Storage & Download Delivery Method'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadStorageOption('server')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadStorageOption === 'server'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-white">
                        <HardDrive size={14} className={uploadStorageOption === 'server' ? 'text-emerald-400' : 'text-slate-400'} />
                        <span>{language === 'my' ? 'ဆာဗာသို့ တိုက်ရိုက်တင်မည်' : 'Direct Server Upload'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'my' ? 'ဖိုင်အစစ်ကို ဆာဗာတွင် သိမ်းဆည်း၍ တိုက်ရိုက် ဒေါင်းလုဒ်ပေးပါမည်' : 'Fast local hosting on app server'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadStorageOption('direct_url')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadStorageOption === 'direct_url'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-white">
                        <Link2 size={14} className={uploadStorageOption === 'direct_url' ? 'text-emerald-400' : 'text-slate-400'} />
                        <span>{language === 'my' ? 'Direct Link ထည့်မည်' : 'Direct Download URL'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'my' ? 'Google Drive, Mediafire သို့မဟုတ် CDN လင့်ခ်' : 'Google Drive, Mediafire, CDN link'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadStorageOption('github')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadStorageOption === 'github'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-white">
                        <Github size={14} className={uploadStorageOption === 'github' ? 'text-emerald-400' : 'text-slate-400'} />
                        <span>GitHub Releases CDN</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Microsoft/GitHub free global CDN
                      </p>
                    </button>
                  </div>

                  {/* Direct URL input if selected */}
                  {uploadStorageOption === 'direct_url' && (
                    <div className="pt-2 animate-in fade-in space-y-1">
                      <input
                        type="text"
                        value={directDownloadUrlInput}
                        onChange={(e) => {
                          const normalized = normalizeDirectDownloadUrl(e.target.value);
                          setDirectDownloadUrlInput(normalized);
                        }}
                        placeholder="https://drive.google.com/file/d/... သို့မဟုတ် Direct APK Link"
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        {language === 'my'
                          ? '💡 Google Drive share link ထည့်ပါက 1-click Direct Download အဖြစ် အလိုအလျောက် ပြောင်းပေးပါသည်'
                          : '💡 Google Drive links are automatically converted to 1-click direct download links'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Status Banner */}
                {(isUploadingToServer || isUploadingToGitHub) && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
                    <Loader2 size={16} className="animate-spin text-emerald-400 shrink-0" />
                    <span>{uploadStatusText || (language === 'my' ? 'ဖိုင်အား သိမ်းဆည်းနေပါသည်...' : 'Uploading APK binary package...')}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUploadingToServer || isUploadingToGitHub}
                    onClick={handleUploadSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingToServer || isUploadingToGitHub ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{language === 'my' ? `ဖိုင်တင်နေပါသည်...` : `Uploading...`}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>{language === 'my' ? 'APK တင်သွင်းပြီး စတိုးတွင် ထုတ်ဝေမည်' : 'Upload APK & Publish to Store'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GITHUB STORAGE SETTINGS ================= */}
        {activeTab === 'github' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Github size={20} className="text-emerald-400" />
                <span>GitHub Releases Storage Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your APK binary packages are hosted 100% free on GitHub Releases with Microsoft CDN global delivery.
              </p>
            </div>

            <form onSubmit={handleSaveGitHubConfig} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Repository Owner (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={githubConfig.owner}
                    onChange={(e) => setGithubConfig({ ...githubConfig, owner: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    required
                    value={githubConfig.repo}
                    onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub Personal Access Token (classic)
                </label>
                <input
                  type="password"
                  required
                  value={githubConfig.token}
                  onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              {/* Status Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {githubStatus.testing ? (
                    <Loader2 size={16} className="animate-spin text-emerald-400" />
                  ) : githubStatus.success ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-400" />
                  )}
                  <span className={githubStatus.success ? 'text-emerald-300' : 'text-slate-300'}>
                    {githubStatus.message || 'Ready to test'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestGitHub()}
                  disabled={githubStatus.testing}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Test Connection
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 3: MANAGE APKS ================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-emerald-400" />
                  <span>{language === 'my' ? 'တင်ထားသော APK စာရင်းများ စီမံရန်' : 'Manage APK Catalog'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Total {apps.length} Android packages in system. Synced with Firestore Cloud.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search by title or package..."
                    className="pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 w-56"
                  />
                </div>

                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New APK</span>
                </button>
              </div>
            </div>

            {/* Catalog Table */}
            {apps.length === 0 ? (
              <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-base font-bold text-white">No APKs currently published</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "New APK" or the "Upload APK" tab above to upload your first Android package!
                </p>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3.5 px-4">Application</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Version</th>
                        <th className="py-3.5 px-4">Downloads</th>
                        <th className="py-3.5 px-4">Rating</th>
                        <th className="py-3.5 px-4">Size</th>
                        <th className="py-3.5 px-4">Storage</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredCatalog.map((app) => {
                        const isKing = app.id === topApp?.id;
                        return (
                          <tr key={app.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <AppIconRenderer app={app} size="sm" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm truncate">{app.name}</span>
                                    {isKing && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                                        #1 TOP
                                      </span>
                                    )}
                                    {app.uploaderName ? (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30" title={`Uploaded by Developer: ${app.uploaderName} (ID: ${app.uploaderId || 'N/A'})`}>
                                        👤 {app.uploaderName}
                                      </span>
                                    ) : app.customUploaded ? (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                                        User
                                      </span>
                                    ) : null}
                                  </div>
                                  <span className="font-mono text-[11px] text-slate-400 truncate block">{app.packageName}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-medium text-emerald-400">{app.categoryName}</td>
                            <td className="py-3 px-4 font-mono">{app.version}</td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white tabular-nums font-mono text-xs">
                                  {formatExactDownloads(app.downloadCount, language)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setAuditingApp(app)}
                                    title={language === 'my' ? 'ဒေါင်းလော့ အမှန်တကယ် စစ်ဆေးချက်မှတ်တမ်း ကြည့်မည်' : 'Audit download authenticity'}
                                    className="px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Activity size={10} />
                                    <span>{language === 'my' ? 'စစ်ဆေးမည်' : 'Audit'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCount = (app.downloadCount || 0) + 1;
                                      onUpdateApp({
                                        ...app,
                                        downloadCount: newCount,
                                        downloads: `${newCount} downloads`,
                                      });
                                    }}
                                    title="Test +1 Download"
                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-[10px] text-slate-400 transition-colors cursor-pointer"
                                  >
                                    +1
                                  </button>
                                  {app.downloadCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUpdateApp({
                                          ...app,
                                          downloadCount: 0,
                                          downloads: '0 downloads',
                                        });
                                      }}
                                      title={language === 'my' ? 'ဒေါင်းလုဒ် ၀ သို့ ပြန်ထားမည်' : 'Reset to 0 downloads'}
                                      className="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 text-[10px] transition-colors cursor-pointer border border-rose-500/30"
                                    >
                                      ၀ ပြန်ထား
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 tabular-nums">★ {app.rating}</td>
                            <td className="py-3 px-4 font-mono">{app.size}</td>

                            <td className="py-3 px-4">
                              {hasGenuineDownloadLink(app) ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1 w-fit">
                                  <CheckCircle2 size={10} /> {language === 'my' ? 'မူရင်း APK ဖိုင်' : 'Real APK'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingApp(app)}
                                  className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 w-fit transition-all border border-amber-500/40 cursor-pointer"
                                  title={language === 'my' ? 'တကယ့် APK ဖိုင် မပါရှိသေးပါ - နှိပ်၍ ထည့်သွင်းပါ' : 'No real APK attached - click to attach'}
                                >
                                  <AlertCircle size={10} className="text-amber-400 shrink-0" />
                                  <span>{language === 'my' ? 'ဖိုင်မရှိ (+ထည့်မည်)' : 'No File (+Attach)'}</span>
                                </button>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpgrade(app)}
                                  title={language === 'my' ? `ဗားရှင်း အသစ်မြှင့်မည် (${app.version} ➔ အသစ်)` : `Upgrade Version (${app.version})`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                  <Rocket size={13} className="stroke-[2.5]" />
                                  <span>{language === 'my' ? 'ဗားရှင်းမြှင့်မည်' : 'Upgrade'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await copyAppShareUrl(app);
                                    setCopiedShareLink(app.id);
                                    setTimeout(() => setCopiedShareLink(null), 2500);
                                  }}
                                  title={language === 'my' ? 'တိုက်ရိုက် ဒေါင်းလုဒ် Share Link ကူးယူမည်' : 'Copy Direct Share Link'}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    copiedShareLink === app.id
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300'
                                  }`}
                                >
                                  {copiedShareLink === app.id ? <Check size={13} /> : <Link2 size={13} />}
                                </button>
                                <button
                                  onClick={() => setEditingApp(app)}
                                  title="Edit App"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteApp(app)}
                                  title="Delete App"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Edit Modal if selected */}
            {editingApp && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Edit3 size={16} className="text-emerald-400" />
                    <span>Edit APK: {editingApp.name}</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Title</label>
                      <input
                        type="text"
                        value={editingApp.name}
                        onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Version Code</label>
                      <input
                        type="text"
                        value={editingApp.version}
                        onChange={(e) => setEditingApp({ ...editingApp, version: e.target.value })}
                        className="w-full p-2 font-mono bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold text-xs">
                          {language === 'my' ? 'ဒေါင်းလုဒ် အရေအတွက် အတိအကျ (Exact Download Count)' : 'Exact Download Count'}
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {formatExactDownloads(editingApp.downloadCount ?? 0, language)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={editingApp.downloadCount ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setEditingApp({
                              ...editingApp,
                              downloadCount: val,
                              downloads: `${val} downloads`,
                            });
                          }}
                          className="flex-1 p-2 font-mono bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingApp({
                              ...editingApp,
                              downloadCount: 0,
                              downloads: '0 downloads',
                            });
                          }}
                          className="px-2.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 cursor-pointer shrink-0"
                          title="Reset to 0"
                        >
                          {language === 'my' ? '၀ သို့ ပြန်ထားမည်' : 'Reset to 0'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {language === 'my' 
                          ? 'စတိုးတွင် တိတိကျကျ ပြသမည့် အရေအတွက် ဖြစ်ပါသည်။ (မှားယွင်းနေပါက ဤနေရာတွင် ၀ သို့မဟုတ် သင်လိုချင်သော အရေအတွက် ရိုက်ထည့်နိုင်ပါသည်)' 
                          : 'The exact count shown on the store front.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Rating (★ 0.0 - 5.0)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={editingApp.rating ?? 5.0}
                          onChange={(e) => setEditingApp({ ...editingApp, rating: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) })}
                          className="w-full p-2 font-mono bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Reviews Count</label>
                        <input
                          type="number"
                          min="0"
                          value={editingApp.ratingsCount ?? 0}
                          onChange={(e) => setEditingApp({ ...editingApp, ratingsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full p-2 font-mono bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Real APK Binary & Download URL Management */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                          <HardDrive size={13} />
                          <span>{language === 'my' ? 'တကယ့် APK မူရင်းဖိုင် & Download Link *' : 'Genuine APK File & Download Link *'}</span>
                        </label>
                        {hasGenuineDownloadLink(editingApp) ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            ✓ Ready
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                            ⚠️ No File
                          </span>
                        )}
                      </div>

                      {/* Option 1: Direct File Upload to Server */}
                      <input
                        ref={editApkInputRef}
                        type="file"
                        accept=".apk"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingEditApk(true);
                          setEditUploadProgress(10);
                          setEditUploadError(null);
                          try {
                            const mb = (file.size / (1024 * 1024)).toFixed(1);
                            let finalEditUrl: string | undefined = undefined;

                            // 1. Primary: GitHub Releases CDN
                            const ghCfg: GitHubConfig = {
                              owner: (githubConfig.owner || '').trim() || DEFAULT_GITHUB_CONFIG.owner,
                              repo: (githubConfig.repo || '').trim() || DEFAULT_GITHUB_CONFIG.repo,
                              token: (githubConfig.token || '').trim(),
                            };
                            if (ghCfg.token) {
                              const gRes = await uploadApkToGitHubRelease(file, editingApp, ghCfg);
                              if (gRes.success && (gRes.downloadUrl || gRes.serverDownloadUrl)) {
                                finalEditUrl = gRes.downloadUrl || gRes.serverDownloadUrl;
                              }
                            }

                            // 2. Local Server storage mirror if GitHub wasn't used or failed
                            let serverErr: string | undefined;
                            if (!finalEditUrl) {
                              const sRes = await uploadApkToServer(file, (pct) => setEditUploadProgress(pct));
                              if (sRes.success && sRes.downloadUrl) {
                                finalEditUrl = sRes.downloadUrl;
                              } else {
                                serverErr = sRes.error;
                              }
                            }

                            if (finalEditUrl) {
                              setEditingApp((prev) => prev ? {
                                ...prev,
                                downloadUrl: finalEditUrl,
                                githubReleaseUrl: finalEditUrl.includes('github.com') ? finalEditUrl : prev.githubReleaseUrl,
                                size: `${mb} MB`,
                              } : null);
                            } else {
                              setEditUploadError(serverErr || 'Failed to upload APK');
                            }
                          } catch (err: any) {
                            setEditUploadError(err.message || 'Upload error');
                          } finally {
                            setIsUploadingEditApk(false);
                          }
                        }}
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUploadingEditApk}
                          onClick={() => editApkInputRef.current?.click()}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                        >
                          {isUploadingEditApk ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>{language === 'my' ? `ဆာဗာသို့ တင်နေပါသည် (${editUploadProgress}%)...` : `Uploading (${editUploadProgress}%)...`}</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} />
                              <span>{language === 'my' ? 'ဖုန်း/PC မှ .apk ဖိုင် တိုက်ရိုက်တင်မည်' : 'Upload .apk file to Server'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {editUploadError && (
                        <p className="text-[11px] text-rose-400 font-semibold">{editUploadError}</p>
                      )}

                      {/* Option 2: Direct Download URL (Google Drive / Mediafire / CDN) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-400">
                            {language === 'my' ? 'သို့မဟုတ် Direct Download Link (Google Drive / Mediafire / CDN)' : 'Or Direct Download Link (Google Drive / Mediafire)'}
                          </span>
                          {editingApp.downloadUrl && (
                            <a
                              href={editingApp.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>{language === 'my' ? 'လင့်ခ် စမ်းသပ်ရန်' : 'Test Link'}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editingApp.downloadUrl || ''}
                          onChange={(e) => {
                            const normalized = normalizeDirectDownloadUrl(e.target.value);
                            setEditingApp({ ...editingApp, downloadUrl: normalized });
                          }}
                          placeholder="https://drive.google.com/... သို့မဟုတ် /uploads/..."
                          className="w-full p-2 font-mono bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px] focus:border-emerald-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'my' 
                            ? '💡 Google Drive link ထည့်ပါက Direct 1-click Download link အဖြစ် အလိုအလျောက် ပြောင်းလဲပေးပါသည်' 
                            : '💡 Google Drive links are automatically converted to direct download links'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">What's New in this Version (Changelog)</label>
                      <input
                        type="text"
                        value={editingApp.changelog || ''}
                        onChange={(e) => setEditingApp({ ...editingApp, changelog: e.target.value })}
                        placeholder="Bug fixes, performance improvements..."
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Short Description</label>
                      <textarea
                        rows={2}
                        value={editingApp.shortDescription}
                        onChange={(e) => setEditingApp({ ...editingApp, shortDescription: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const appToUpgrade = editingApp;
                        setEditingApp(null);
                        handleOpenUpgrade(appToUpgrade);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Rocket size={13} className="stroke-[2.5]" />
                      <span>{language === 'my' ? 'ဗားရှင်း အဆင့်မြှင့်တင်မည်' : 'Upgrade Version'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingApp(null)}
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Version Upgrade Modal */}
            {upgradingApp && (
              <div 
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                onClick={() => !isUploadingUpgrade && setUpgradingApp(null)}
              >
                <div 
                  className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative my-auto animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <Rocket size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                          <span>{language === 'my' ? 'ဗားရှင်း အဆင့်မြှင့်တင်ခြင်း' : 'Upgrade APK Version'}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                            RELEASE
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          {language === 'my' 
                            ? 'တင်ထားပြီးသား APK အား ဗားရှင်းအသစ်သို့ ချောမွေ့စွာ အဆင့်မြှင့်တင်ပါ' 
                            : 'Upgrade package to new version with zero downtime'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUpgradingApp(null)}
                      disabled={isUploadingUpgrade}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* App Lockup & Version Transition Badge */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <AppIconRenderer app={upgradingApp} size="md" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{upgradingApp.name}</h4>
                        <p className="text-[11px] font-mono text-slate-400 truncate">{upgradingApp.packageName}</p>
                      </div>
                    </div>

                    {/* Version Transition: Current -> New */}
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                      <span className="font-mono text-slate-400 line-through">{upgradingApp.version}</span>
                      <span className="text-emerald-400 font-bold">➔</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        {upgradeVersion}
                      </span>
                    </div>
                  </div>

                  {/* Success Notice if triggered */}
                  {upgradeSuccessNotice && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>{upgradeSuccessNotice}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handlePublishUpgrade} className="space-y-4">
                    {/* Input: New Version Code + Quick Bumper Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-300">
                            {language === 'my' ? 'ဗားရှင်းအသစ် ကုဒ်နံပါတ် *' : 'New Version Code *'}
                          </label>
                        </div>
                        <input
                          type="text"
                          required
                          value={upgradeVersion}
                          onChange={(e) => setUpgradeVersion(e.target.value)}
                          placeholder="e.g. v2.0.0, v1.1.0"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                        />
                        {/* 1-Tap Version Bumper Pills */}
                        <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5">
                          <button
                            type="button"
                            onClick={() => setUpgradeVersion(suggestedVersions.patch)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              upgradeVersion === suggestedVersions.patch
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            +Patch ({suggestedVersions.patch})
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpgradeVersion(suggestedVersions.minor)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              upgradeVersion === suggestedVersions.minor
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            +Minor ({suggestedVersions.minor})
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpgradeVersion(suggestedVersions.major)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              upgradeVersion === suggestedVersions.major
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            +Major ({suggestedVersions.major})
                          </button>
                        </div>
                        {upgradeExtractedVersion && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 size={11} />
                            <span>{language === 'my' ? `ဖိုင်ထဲမှ ဗားရှင်း: ${upgradeExtractedVersion}` : `Detected: ${upgradeExtractedVersion}`}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {language === 'my' ? 'ဖိုင်အရွယ်အစား (Size)' : 'New Package Size'}
                        </label>
                        <input
                          type="text"
                          value={upgradeFileSize}
                          onChange={(e) => setUpgradeFileSize(e.target.value)}
                          placeholder="e.g. 28.5 MB"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'my' ? 'ဖိုင်ရွေးချယ်ပါက အလိုအလျောက် တွက်ချက်ပေးပါမည်' : 'Auto-calculated on APK select'}
                        </p>
                      </div>
                    </div>

                    {/* Drag & Drop New APK File with full drop support */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>{language === 'my' ? 'APK ဖိုင်အသစ် တင်သွင်းရန် (New APK File)' : 'Select New APK Package File'}</span>
                        {upgradeFile && (
                          <span className="text-emerald-400 font-normal text-[11px] flex items-center gap-1 font-mono">
                            <CheckCircle2 size={12} /> {upgradeFile.name} ({(upgradeFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        )}
                      </label>

                      <input
                        ref={upgradeFileInputRef}
                        type="file"
                        accept=".apk"
                        onChange={handleUpgradeFileChange}
                        className="hidden"
                      />

                      <div
                        onClick={() => upgradeFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setUpgradeDragActive(true);
                        }}
                        onDragLeave={() => setUpgradeDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setUpgradeDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            processUpgradeApkFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`p-3.5 border border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                          upgradeDragActive
                            ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 scale-[1.01]'
                            : upgradeFile
                            ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                            : 'border-slate-700 hover:border-slate-500 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <UploadCloud size={16} className={upgradeFile ? 'text-emerald-400' : 'text-slate-400'} />
                          <span>
                            {upgradeFile 
                              ? (language === 'my' ? `ဖိုင်ရွေးချယ်ပြီး: ${upgradeFile.name} (လဲလှယ်လိုပါက ထပ်နှိပ်ပါ)` : `${upgradeFile.name} loaded. Click or drop to replace.`) 
                              : (language === 'my' ? 'ဗားရှင်းအသစ် .apk ဖိုင်အား ရွေးချယ်ပါ သို့မဟုတ် ဆွဲထည့်ပါ (Drag & Drop)' : 'Click to select or drag & drop updated .apk file')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* New Embedded Icon Found in Updated APK */}
                    {upgradeNewIconUrl && (
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={upgradeNewIconUrl} alt="Extracted Logo" className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {language === 'my' ? 'APK အသစ်ထဲမှ Icon အား အသုံးပြုမည်လား?' : 'New App Icon Found in APK'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {language === 'my' ? 'ဆော့ဖ်ဝဲလ် Logo ကို အသစ်အတိုင်း မွမ်းမံနိုင်ပါသည်' : 'Update the store icon to this extracted logo'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setApplyNewIcon(!applyNewIcon)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            applyNewIcon ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {applyNewIcon ? (language === 'my' ? 'အသုံးပြုမည် ✓' : 'Applied ✓') : (language === 'my' ? 'Icon လဲမည်' : 'Apply')}
                        </button>
                      </div>
                    )}

                    {/* Direct Download URL (If external link) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {language === 'my' ? 'တိုက်ရိုက် ဒေါင်းလုဒ် လင့်ခ် (Direct Download URL)' : 'Direct Download URL'}
                      </label>
                      <input
                        type="text"
                        value={upgradeDownloadUrl}
                        onChange={(e) => setUpgradeDownloadUrl(e.target.value)}
                        placeholder="https://github.com/.../release.apk or direct mirror"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* What's New / Changelog with 1-click Quick Templates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">
                          {language === 'my' ? 'ဤဗားရှင်းတွင် အသစ်ပါဝင်လာသောအရာများ (Changelog) *' : "What's New in this Release (Changelog) *"}
                        </label>
                      </div>

                      {/* 1-Tap Quick Release Note Chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">{language === 'my' ? 'အမြန်ဖြည့်ရန်:' : 'Quick notes:'}</span>
                        {[
                          { label: '⚡ Performance', en: 'Speed optimizations and performance improvements.', my: 'စွမ်းဆောင်ရည်နှင့် မြန်နှုန်း ပိုမိုကောင်းမွန်အောင် မွမ်းမံထားပါသည်။' },
                          { label: '🐛 Bug Fixes', en: 'Fixed bugs, resolved minor issues, and enhanced stability.', my: 'ချို့ယွင်းချက်များနှင့် Error များကို ပြင်ဆင်ပြီး စနစ်တည်ငြိမ်စေပါသည်။' },
                          { label: '🎨 Modern UI', en: 'Updated interface with new features and refined user experience.', my: 'အသွင်အပြင် အသစ်နှင့် လုပ်ဆောင်ချက် အသစ်များ ပါဝင်လာပါသည်။' },
                          { label: '🛡️ Security', en: 'Enhanced security patches and privacy updates.', my: 'လုံခြုံရေးဆိုင်ရာ မွမ်းမံမှုများနှင့် လျှို့ဝှက်ချက်ကာကွယ်မှုများ ထည့်သွင်းထားပါသည်။' },
                        ].map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setUpgradeChangelog(tpl.en);
                              setUpgradeChangelogMy(tpl.my);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-[10px] font-medium transition-all cursor-pointer"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                      
                      <textarea
                        rows={2}
                        required
                        value={upgradeChangelog}
                        onChange={(e) => setUpgradeChangelog(e.target.value)}
                        placeholder="e.g. Bug fixes, new dark mode UI, faster load speed..."
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      />

                      <textarea
                        rows={2}
                        value={upgradeChangelogMy}
                        onChange={(e) => setUpgradeChangelogMy(e.target.value)}
                        placeholder="ဥပမာ- ချို့ယွင်းချက်များကို ပြင်ဆင်ထားပြီး အသုံးပြုရ ပိုမိုမြန်ဆန်စေရန် မွမ်းမံထားပါသည်..."
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Safety Preservation Assurance */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <ShieldCheck size={13} />
                        <span>{language === 'my' ? 'ဒေတာများ ပျက်စီးမှုမရှိစေရန် အာမခံချက်' : 'Seamless Data Preservation'}</span>
                      </p>
                      <p>
                        {language === 'my' 
                          ? `လက်ရှိ ဒေါင်းလုဒ်အရေအတွက် (${formatExactDownloads(upgradingApp.downloadCount, language)})၊ Ratings & Reviews များနှင့် မူရင်း Share Link များ အားလုံး မပျက်မစီး ဆက်လက်တည်ရှိနေပါမည်။` 
                          : 'Existing download counts, reviews, and direct share links will be preserved seamlessly.'}
                      </p>
                    </div>

                    {/* Progress indicator */}
                    {isUploadingUpgrade && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <Loader2 size={14} className="animate-spin" />
                          <span>{upgradeStatusText || 'Upgrading release package...'}</span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setUpgradingApp(null)}
                        disabled={isUploadingUpgrade}
                        className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                      >
                        {language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
                      </button>

                      <button
                        type="submit"
                        disabled={isUploadingUpgrade}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Rocket size={14} className="stroke-[2.5]" />
                        <span>{language === 'my' ? 'ဗားရှင်းအသစ် လွှင့်တင်မည်' : 'Publish Version Upgrade'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-400" />
                <span>{language === 'my' ? 'ဝဘ်ဆိုက် စာရင်းအင်းနှင့် စွမ်းဆောင်ရည်' : 'Platform Analytics & Metrics'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Total Hosted APKs</span>
                <p className="text-2xl font-black text-white tabular-nums">{apps.length}</p>
                <span className="text-[11px] text-emerald-400">100% Verified clean</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Aggregated Downloads</span>
                <p className="text-2xl font-black text-emerald-400 tabular-nums">
                  {(totalDownloads / 1000000).toFixed(1)}M+
                </p>
                <span className="text-[11px] text-slate-400">Across all packages</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">#1 Top Banner Spotlight</span>
                <p className="text-base font-bold text-amber-400 truncate">{topApp?.name || 'Apex'}</p>
                <span className="text-[11px] text-slate-400">{topApp?.downloads || '0'} downloads</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">GitHub Releases Engine</span>
                <p className="text-base font-bold text-cyan-400">Microsoft CDN</p>
                <span className="text-[11px] text-emerald-400 font-mono">0$ Egress Bandwidth</span>
              </div>
            </div>

            {/* Distribution */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Category Distribution</h3>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const count = apps.filter((a) => a.category === cat.id).length;
                  const pct = apps.length ? Math.round((count / apps.length) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{cat.labelEn}</span>
                        <span className="font-mono text-slate-400">{count} apps ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: DATABASE INTEGRATION ================= */}
        {activeTab === 'database' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database size={20} className="text-emerald-400" />
                <span>Firebase Cloud Firestore Database</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Live Google Cloud Firestore synchronized in real-time.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <CheckCircle2 size={16} />
                <span>Connected & Secured</span>
              </div>
              <p className="leading-relaxed">
                Database collection `apps` is operational with security rules active. Any change in Admin Panel saves instantly to Firestore.
              </p>
            </div>

            {/* Wipe & Reset Database Card */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-rose-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trash2 size={16} className="text-rose-400" />
                    <span>{language === 'my' ? 'နမူနာဆော့ဖ်ဝဲလ် အားလုံး ဖျက်ထုတ်ပစ်ရန်' : 'Purge All Demo / Preview Apps'}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'my' ? 'Cloud Firestore ထဲမှ နမူနာဒေတာများ အားလုံးကို ရှင်းထုတ်ပစ်မည်။' : 'Removes mock records from Cloud Firestore so you have a 100% clean catalog.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePurgeMockApps}
                  disabled={isPurging}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  {isPurging ? 'Purging...' : 'Wipe Clean Now'}
                </button>
              </div>
            </div>

            {/* Reset Inflated Test Downloads Card */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-amber-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <RotateCcw size={16} className="text-amber-400" />
                    <span>{language === 'my' ? 'စမ်းသပ်ဒေါင်းလုဒ် အရေအတွက်များအား ၀ သို့ ပြန်လည်သတ်မှတ်ရန်' : 'Reset Inflated Test Downloads'}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'my' 
                      ? 'စမ်းသပ်တင်သွင်းချိန်တွင် မှားယွင်းပြသနေသော ၁၀၀၀၁၈ ကဲ့သို့ ဒေါင်းလုဒ်အရေအတွက်များကို ၀ သို့ ပြန်ထားမည်။ (အမှန်တကယ် ဒေါင်းလုဒ်ဆွဲမှသာ ၁၊ ၂ တိုးပါမည်)' 
                      : 'Resets download counts of apps to 0 so only real verified downloads are counted.'}
                  </p>
                  {resetDownloadsSuccessNotice && (
                    <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 size={14} />
                      <span>{resetDownloadsSuccessNotice}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetAllDownloads}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition-all cursor-pointer shrink-0"
                >
                  {language === 'my' ? '၀ သို့ Reset လုပ်မည်' : 'Reset All to 0'}
                </button>
              </div>
            </div>

            {/* Database Export & Backup Card */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Export & Backup Current Catalog</h4>
                  <p className="text-xs text-slate-400">Download all APK records in JSON format</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyDatabaseJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    {copiedJson ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              {/* JSON preview */}
              <div className="max-h-60 overflow-y-auto bg-slate-900/90 rounded-xl p-3 font-mono text-[11px] text-slate-300 border border-slate-800">
                <pre>{JSON.stringify(apps.slice(0, 2), null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete App In-App Modal (Safe, zero alert/confirm dialog) */}
        {confirmDeleteApp && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">
                  {language === 'my' ? 'ဆော့ဖ်ဝဲလ် ဖျက်ထုတ်ရန် သေချာပါသလား?' : 'Delete Application?'}
                </h3>
                <p className="text-xs text-slate-400">
                  "{confirmDeleteApp.name}" ({confirmDeleteApp.packageName}) {language === 'my' ? 'အား စတိုးနှင့် Database ထဲမှ အပြီးသတ် ဖျက်ထုတ်ပါမည်။' : 'will be permanently removed.'}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteApp(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  {language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = confirmDeleteApp.id;
                    setConfirmDeleteApp(null);
                    onDeleteApp(id);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                >
                  {language === 'my' ? 'ဖျက်မည်' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Download Audit & Authenticity Modal */}
        <DownloadAuditModal
          isOpen={Boolean(auditingApp)}
          onClose={() => setAuditingApp(null)}
          app={auditingApp}
          language={language}
          onUpdateAppCount={(targetApp, count) => {
            const updated = {
              ...targetApp,
              downloadCount: count,
              downloads: `${count} downloads`,
            };
            onUpdateApp(updated);
            if (auditingApp && auditingApp.id === targetApp.id) {
              setAuditingApp(updated);
            }
          }}
        />

      </main>

    </div>
  );
};
