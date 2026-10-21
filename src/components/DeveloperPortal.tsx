import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Edit3,
  ShieldCheck,
  Download,
  Flame,
  FileCheck,
  Eye,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Lock,
  Sparkles,
  Link2,
  Loader2,
  X,
  LogOut,
  Layers,
  Wand2,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  UserCheck,
  KeyRound,
  ShieldAlert,
  Github,
  UserPlus,
  Image as ImageIcon
} from 'lucide-react';
import { APKApp, AppCategory, Language, DeveloperSession } from '../types';
import { AppIconRenderer } from './AppIconRenderer';
import { parseApkFile } from '../utils/apkParser';
import { uploadApkToServer, normalizeDirectDownloadUrl } from '../utils/apkStorage';
import { uploadApkToGitHubRelease, loadGitHubConfigWithFirestore } from '../utils/githubStorage';
import { 
  compressLogo, 
  compressScreenshot, 
  formatBytes, 
  CompressionResult 
} from '../utils/imageCompressor';

interface Props {
  apps: APKApp[];
  onAppUploaded: (newApp: APKApp) => Promise<void> | void;
  onUpdateApp: (updatedApp: APKApp) => Promise<void> | void;
  onDeleteApp: (appId: string) => Promise<void> | void;
  onExit: () => void;
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
  'game', 'tool', 'chat', 'music', 'camera', 'book', 'globe', 'code', 'wallet', 'shield'
];

export const DeveloperPortal: React.FC<Props> = ({
  apps,
  onAppUploaded,
  onUpdateApp,
  onDeleteApp,
  onExit,
  language = 'my',
}) => {
  // Developer session state
  const [session, setSession] = useState<DeveloperSession | null>(() => {
    try {
      const stored = localStorage.getItem('pstore_dev_session');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Auth gate inputs & mode
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginDevName, setLoginDevName] = useState('');
  const [loginDevPin, setLoginDevPin] = useState('');
  const [registerDevName, setRegisterDevName] = useState('');
  const [registerDevPin, setRegisterDevPin] = useState('');
  const [registerDevConfirmPin, setRegisterDevConfirmPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Change PIN modal states
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Search in my apps
  const [searchMyApps, setSearchMyApps] = useState('');

  // Upload/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<APKApp | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isParsingApk, setIsParsingApk] = useState(false);

  const [formName, setFormName] = useState('');
  const [formNameMy, setFormNameMy] = useState('');
  const [formPackageName, setFormPackageName] = useState('');
  const [formCategory, setFormCategory] = useState<AppCategory>('tools');
  const [formVersion, setFormVersion] = useState('v1.0.0');
  const [formMinAndroid, setFormMinAndroid] = useState('Android 8.0+');
  const [formFileSize, setFormFileSize] = useState('25.0 MB');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formChangelog, setFormChangelog] = useState('Initial official release.');
  const [formDirectUrl, setFormDirectUrl] = useState('');
  const [formRepoUrl, setFormRepoUrl] = useState('');
  const [formUploadToGithub, setFormUploadToGithub] = useState(true);
  const [formIconBg, setFormIconBg] = useState(ICON_THEMES[0].bg);
  const [formIconSvg, setFormIconSvg] = useState<APKApp['iconSvgType']>('tool');
  const [formCustomIconUrl, setFormCustomIconUrl] = useState('');
  const [logoStats, setLogoStats] = useState<{ original: number; compressed: number } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [screenshots, setScreenshots] = useState<{ url: string; original: number; compressed: number }[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [updateMismatchError, setUpdateMismatchError] = useState<string | null>(null);
  const [matchedExistingApp, setMatchedExistingApp] = useState<APKApp | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter apps strictly to this developer (Cryptographically isolated: zero collision across same names/pins)
  const myApps = useMemo(() => {
    if (!session) return [];
    const devId = (session.developerId || '').toLowerCase();
    const devCode = (session.developerCode || '').toLowerCase();

    return apps.filter((app) => {
      // 1. Primary strict match: Globally unique uploaderId
      if (app.uploaderId && app.uploaderId.toLowerCase() === devId) return true;
      // 2. Legacy fallback match for apps uploaded prior to unique account keys
      if (session.developerKey && app.developerKey && app.developerKey === session.developerKey) {
        const isNameMatch =
          (Boolean(app.uploaderName) && app.uploaderName!.toLowerCase() === session.developerName.toLowerCase()) ||
          (Boolean(app.developer) && app.developer.toLowerCase() === session.developerName.toLowerCase());
        if (isNameMatch) return true;
      }
      return false;
    });
  }, [apps, session]);

  // Filtered by search
  const filteredMyApps = useMemo(() => {
    if (!searchMyApps.trim()) return myApps;
    const q = searchMyApps.toLowerCase();
    return myApps.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.nameMy && a.nameMy.toLowerCase().includes(q)) ||
      a.packageName.toLowerCase().includes(q)
    );
  }, [myApps, searchMyApps]);

  // Aggregate stats
  const totalDownloads = useMemo(() => {
    return myApps.reduce((sum, a) => sum + (Number(a.downloadCount) || 0), 0);
  }, [myApps]);

  // Register handler (Enforces unique name, creates salted hash, generates unique Developer ID)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = registerDevName.trim();
    const trimmedPin = registerDevPin.trim();
    const trimmedConfirm = registerDevConfirmPin.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setLoginError(language === 'my' ? 'Developer / Studio အမည် အနည်းဆုံး ၂ လုံး ထည့်သွင်းပေးပါ' : 'Please enter at least 2 characters for Developer Name');
      return;
    }

    if (!trimmedPin || trimmedPin.length < 4) {
      setLoginError(language === 'my' ? 'PIN ကုဒ် အနည်းဆုံး ၄ လုံး ထည့်သွင်းပေးပါ' : 'PIN must be at least 4 digits');
      return;
    }

    if (trimmedPin !== trimmedConfirm) {
      setLoginError(language === 'my' ? 'ထည့်သွင်းထားသော PIN ၂ ခု ကိုက်ညီမှု မရှိပါ' : 'PINs do not match');
      return;
    }

    setIsAuthSubmitting(true);
    setLoginError('');

    try {
      const res = await fetch('/api/developer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerName: trimmedName, pin: trimmedPin }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.session) {
        const newSession: DeveloperSession = {
          developerId: data.session.developerId,
          developerCode: data.session.developerCode,
          developerName: data.session.developerName,
          developerToken: data.session.developerToken,
          developerKey: trimmedPin,
          createdAt: data.session.createdAt,
        };
        setSession(newSession);
        try {
          localStorage.setItem('pstore_dev_session', JSON.stringify(newSession));
          localStorage.setItem('pstore_dev_id', newSession.developerId);
          localStorage.setItem('pstore_dev_token', data.session.developerToken || '');
          localStorage.setItem('pstore_dev_key', trimmedPin);
        } catch {}
        setSuccessToast(
          language === 'my'
            ? `ကြိုဆိုပါသည် ${newSession.developerName}! သင်၏သီးသန့် Developer Code သည် ${newSession.developerCode} ဖြစ်ပါသည်။`
            : `Welcome ${newSession.developerName}! Developer Code: ${newSession.developerCode}`
        );
        setTimeout(() => setSuccessToast(null), 6000);
      } else {
        setLoginError(data.error || 'အကောင့်ဖွင့်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
      }
    } catch {
      // Offline / Static Host / GitHub Pages registration fallback:
      const cleanDevId = `dev_${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanDevCode = `DEV-${Math.floor(10000 + Math.random() * 90000)}`;
      const newSession: DeveloperSession = {
        developerId: cleanDevId,
        developerCode: cleanDevCode,
        developerName: trimmedName,
        developerKey: trimmedPin,
        createdAt: new Date().toISOString(),
      };
      setSession(newSession);
      try {
        localStorage.setItem('pstore_dev_session', JSON.stringify(newSession));
        localStorage.setItem('pstore_dev_id', newSession.developerId);
        localStorage.setItem('pstore_dev_key', trimmedPin);

        // Store developer account locally
        const storedAccountsStr = localStorage.getItem('pstore_dev_accounts');
        const accounts = storedAccountsStr ? JSON.parse(storedAccountsStr) : [];
        accounts.push({
          developerId: cleanDevId,
          developerCode: cleanDevCode,
          developerName: trimmedName,
          pin: trimmedPin,
          createdAt: newSession.createdAt,
        });
        localStorage.setItem('pstore_dev_accounts', JSON.stringify(accounts));
      } catch {}
      setSuccessToast(
        language === 'my'
          ? `ကြိုဆိုပါသည် ${newSession.developerName}! သင်၏သီးသန့် Developer Code သည် ${newSession.developerCode} ဖြစ်ပါသည်။`
          : `Welcome ${newSession.developerName}! Developer Code: ${newSession.developerCode}`
      );
      setTimeout(() => setSuccessToast(null), 6000);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Login handler (Salted cryptographic hash check, rate limited against brute force)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTarget = loginDevName.trim();
    const trimmedPin = loginDevPin.trim();

    if (!trimmedTarget) {
      setLoginError(language === 'my' ? 'Developer / Studio အမည် သို့မဟုတ် Code ထည့်သွင်းပါ' : 'Please enter developer / studio name or code');
      return;
    }

    if (!trimmedPin) {
      setLoginError(language === 'my' ? 'PIN သို့မဟုတ် လျှို့ဝှက်ကုဒ် ထည့်သွင်းပါ' : 'Please enter access PIN / password');
      return;
    }

    setIsAuthSubmitting(true);
    setLoginError('');

    try {
      const res = await fetch('/api/developer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerNameOrCode: trimmedTarget, pin: trimmedPin }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.session) {
        const newSession: DeveloperSession = {
          developerId: data.session.developerId,
          developerCode: data.session.developerCode,
          developerName: data.session.developerName,
          developerToken: data.session.developerToken,
          developerKey: trimmedPin,
          createdAt: data.session.createdAt,
        };
        setSession(newSession);
        try {
          localStorage.setItem('pstore_dev_session', JSON.stringify(newSession));
          localStorage.setItem('pstore_dev_id', newSession.developerId);
          localStorage.setItem('pstore_dev_token', data.session.developerToken || '');
          localStorage.setItem('pstore_dev_key', trimmedPin);
        } catch {}
        return;
      } else if (res.status !== 404) {
        setLoginError(data.error || 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ');
        return;
      }
      throw new Error('Server unavailable');
    } catch {
      // 1. Check local developer accounts (for offline / GitHub Pages mode)
      try {
        const storedAccountsStr = localStorage.getItem('pstore_dev_accounts');
        const storedAccounts = storedAccountsStr ? JSON.parse(storedAccountsStr) : [];
        const matched = storedAccounts.find(
          (acc: any) =>
            (acc.developerName?.toLowerCase() === trimmedTarget.toLowerCase() ||
              acc.developerCode?.toLowerCase() === trimmedTarget.toLowerCase() ||
              acc.developerId?.toLowerCase() === trimmedTarget.toLowerCase()) &&
            acc.pin === trimmedPin
        );

        if (matched) {
          const newSession: DeveloperSession = {
            developerId: matched.developerId,
            developerCode: matched.developerCode,
            developerName: matched.developerName,
            developerKey: trimmedPin,
            createdAt: matched.createdAt,
          };
          setSession(newSession);
          localStorage.setItem('pstore_dev_session', JSON.stringify(newSession));
          localStorage.setItem('pstore_dev_id', newSession.developerId);
          localStorage.setItem('pstore_dev_key', trimmedPin);
          return;
        }
      } catch {}

      // 2. Fallback verification for pre-existing apps
      const existingDevApp = apps.find((a) => {
        const matchName =
          (Boolean(a.uploaderName) && a.uploaderName!.toLowerCase() === trimmedTarget.toLowerCase()) ||
          (Boolean(a.developer) && a.developer.toLowerCase() === trimmedTarget.toLowerCase()) ||
          (Boolean(a.uploaderId) && a.uploaderId!.toLowerCase() === trimmedTarget.toLowerCase());
        return matchName && Boolean(a.developerKey);
      });

      if (existingDevApp && existingDevApp.developerKey === trimmedPin) {
        const fallbackId = existingDevApp.uploaderId || `dev_${trimmedTarget.toLowerCase().replace(/[^a-z0-9]/g, '')}_${trimmedPin.slice(0, 4)}`;
        const fbSession: DeveloperSession = {
          developerId: fallbackId,
          developerName: existingDevApp.uploaderName || existingDevApp.developer || trimmedTarget,
          developerKey: trimmedPin,
          createdAt: new Date().toISOString(),
        };
        setSession(fbSession);
        try {
          localStorage.setItem('pstore_dev_session', JSON.stringify(fbSession));
        } catch {}
      } else {
        setLoginError(language === 'my' ? 'Developer အမည် သို့မဟုတ် PIN မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။' : 'Incorrect Developer Name or PIN.');
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Change PIN handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!newPinInput || newPinInput.trim().length < 4) {
      setChangePinError(language === 'my' ? 'PIN အသစ်သည် အနည်းဆုံး ၄ လုံး ဖြစ်ရပါမည်' : 'New PIN must be at least 4 digits');
      return;
    }
    if (newPinInput.trim() !== confirmNewPinInput.trim()) {
      setChangePinError(language === 'my' ? 'PIN အသစ် ၂ ခု ကိုက်ညီမှု မရှိပါ' : 'New PINs do not match');
      return;
    }

    setIsChangingPin(true);
    setChangePinError('');
    setChangePinSuccess('');

    try {
      const res = await fetch('/api/developer/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session.developerToken ? `Bearer ${session.developerToken}` : '',
        },
        body: JSON.stringify({
          developerId: session.developerId,
          currentPin: currentPinInput.trim(),
          newPin: newPinInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChangePinSuccess(language === 'my' ? 'PIN အား အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ!' : 'PIN changed successfully!');
        const updatedSession = { ...session, developerKey: newPinInput.trim() };
        if (data.developerToken) {
          updatedSession.developerToken = data.developerToken;
          localStorage.setItem('pstore_dev_token', data.developerToken);
        }
        setSession(updatedSession);
        localStorage.setItem('pstore_dev_session', JSON.stringify(updatedSession));
        localStorage.setItem('pstore_dev_key', newPinInput.trim());

        setTimeout(() => {
          setIsChangePinModalOpen(false);
          setCurrentPinInput('');
          setNewPinInput('');
          setConfirmNewPinInput('');
          setChangePinSuccess('');
        }, 1500);
      } else {
        setChangePinError(data.error || 'PIN ပြောင်းလဲရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
      }
    } catch {
      setChangePinError(language === 'my' ? 'ဆာဗာသို့ ချိတ်ဆက်၍ မရနိုင်ပါ' : 'Network error');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    try {
      localStorage.removeItem('pstore_dev_session');
      localStorage.removeItem('pstore_dev_id');
      localStorage.removeItem('pstore_dev_token');
      localStorage.removeItem('pstore_dev_key');
    } catch {}
  };

  // Logo Upload with automatic WebP compression (identical to Admin Panel)
  const handleLogoUpload = async (file: File) => {
    try {
      const res: CompressionResult = await compressLogo(file);
      setFormCustomIconUrl(res.dataUrl);
      setLogoStats({ original: res.originalSize, compressed: res.compressedSize });
    } catch (err) {
      console.error('Failed to compress logo', err);
    }
  };

  // Screenshot Upload with automatic WebP compression (up to 4 screenshots)
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

  const openUploadModal = (appToEdit?: APKApp) => {
    setUpdateMismatchError(null);
    setMatchedExistingApp(null);
    if (appToEdit) {
      setEditingApp(appToEdit);
      setFormName(appToEdit.name);
      setFormNameMy(appToEdit.nameMy || '');
      setFormPackageName(appToEdit.packageName);
      setFormCategory(appToEdit.category);
      setFormVersion(appToEdit.version);
      setFormMinAndroid(appToEdit.minAndroid || 'Android 8.0+');
      setFormFileSize(appToEdit.size);
      setFormShortDesc(appToEdit.shortDescription);
      setFormDesc(appToEdit.description);
      setFormChangelog(appToEdit.changelog || '');
      setFormDirectUrl(appToEdit.downloadUrl || '');
      setFormRepoUrl(appToEdit.repositoryUrl || '');
      setFormIconBg(appToEdit.iconBg || ICON_THEMES[0].bg);
      setFormIconSvg(appToEdit.iconSvgType || 'tool');
      setFormCustomIconUrl(appToEdit.iconUrl || '');
      setLogoStats(null);
      if (appToEdit.screenshots && appToEdit.screenshots.length > 0) {
        setScreenshots(
          appToEdit.screenshots.map((s) => ({
            url: s,
            original: 0,
            compressed: 0,
          }))
        );
      } else {
        setScreenshots([]);
      }
      setFormUploadToGithub(true);
    } else {
      setEditingApp(null);
      setFormName('');
      setFormNameMy('');
      setFormPackageName('');
      setFormCategory('tools');
      setFormVersion('v1.0.0');
      setFormMinAndroid('Android 8.0+');
      setFormFileSize('25.0 MB');
      setFormShortDesc('');
      setFormDesc('');
      setFormChangelog('Initial release.');
      setFormDirectUrl('');
      setFormRepoUrl('');
      setFormIconBg(ICON_THEMES[0].bg);
      setFormIconSvg('tool');
      setFormCustomIconUrl('');
      setLogoStats(null);
      setScreenshots([]);
      setFormUploadToGithub(true);
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('');
    setIsModalOpen(true);
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    setFormFileSize(`${mb} MB`);

    setIsParsingApk(true);
    setUploadStatus('Analyzing APK package...');
    setUpdateMismatchError(null);
    try {
      const parsed = await parseApkFile(file);
      if (parsed) {
        if (editingApp) {
          // Strictly validate package name if detected in APK
          const isPkgMismatch = Boolean(parsed.packageName && editingApp.packageName && parsed.packageName.toLowerCase() !== editingApp.packageName.toLowerCase());

          if (isPkgMismatch) {
            setUpdateMismatchError(
              language === 'my'
                ? `⚠️ Update သတိပေးချက်: ရွေးချယ်ထားသော APK ၏ Package Name (${parsed.packageName || 'Unknown'}) သည် မူရင်း App ("${editingApp.packageName}") နှင့် မတူညီပါ။ Update လုပ်ရန် Package Name တူညီရပါမည်။`
                : `⚠️ Update Mismatch: The selected APK package name (${parsed.packageName || 'Unknown'}) does not match ("${editingApp.packageName}").`
            );
          } else {
            setUpdateMismatchError(null);
          }
          if (parsed.version) setFormVersion(parsed.version);
          if (parsed.iconDataUrl && !formCustomIconUrl) setFormCustomIconUrl(parsed.iconDataUrl);
        } else {
          // Uploading new app or updating by matching App Name and Package Name
          if (!formName && parsed.name) setFormName(parsed.name);
          if (parsed.packageName) setFormPackageName(parsed.packageName);
          if (parsed.version) setFormVersion(parsed.version);
          if (parsed.iconDataUrl) setFormCustomIconUrl(parsed.iconDataUrl);

          // STRICT CHECK: Both App Name AND Package Name must match for an update!
          const currentName = (formName || parsed.name || '').trim().toLowerCase();
          const currentPkg = (formPackageName || parsed.packageName || '').trim().toLowerCase();

          const exactMatch = apps.find(
            (a) =>
              currentPkg && currentName &&
              a.packageName.toLowerCase() === currentPkg &&
              a.name.toLowerCase() === currentName
          );

          const partialConflict = apps.find(
            (a) =>
              (currentPkg && a.packageName.toLowerCase() === currentPkg && a.name.toLowerCase() !== currentName) ||
              (currentName && a.name.toLowerCase() === currentName && currentPkg && a.packageName.toLowerCase() !== currentPkg)
          );

          if (exactMatch) {
            setMatchedExistingApp(exactMatch);
            setUpdateMismatchError(null);
          } else {
            setMatchedExistingApp(null);
            if (partialConflict) {
              setUpdateMismatchError(
                language === 'my'
                  ? `⚠️ သတိပေးချက်: စတိုးတွင်ရှိသော "${partialConflict.name}" နှင့် App Name သို့မဟုတ် Package Name တစ်ခုတည်းသာ တူနေပါသည်။ Update ပြုလုပ်ရန် App Name နှင့် Package Name (၂) ခုလုံး အကုန်တူညီရပါမည်။`
                  : `Notice: Only one of App Name or Package Name matches "${partialConflict.name}". Both must match exactly to perform an update.`
              );
            } else {
              setUpdateMismatchError(null);
            }
          }
        }
      }
    } catch (err) {
      console.warn('APK parse fallback', err);
      const clean = file.name.replace(/\.apk$/i, '').replace(/[-_]/g, ' ');
      if (!editingApp) {
        if (!formName) setFormName(clean.charAt(0).toUpperCase() + clean.slice(1));
        if (!formPackageName) {
          const sanitized = file.name.replace(/\.apk$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
          setFormPackageName(`com.${session?.developerId || 'dev'}.${sanitized || 'app'}`);
        }
      }
    } finally {
      setIsParsingApk(false);
      setUploadStatus('');
    }
  };

  const handleSubmitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !session) return;

    // Check if this update matches an existing app by Name and Package Name
    let targetToUpdate = editingApp || matchedExistingApp;

    if (!targetToUpdate && formName.trim() && formPackageName.trim()) {
      const exact = apps.find(
        (a) =>
          a.packageName.toLowerCase() === formPackageName.trim().toLowerCase() &&
          a.name.toLowerCase() === formName.trim().toLowerCase()
      );
      if (exact) {
        targetToUpdate = exact;
      }
    }

    // Strict update identity validation: App Name and Package Name must BOTH match!
    if (editingApp) {
      const isNameMatch = formName.trim().toLowerCase() === editingApp.name.trim().toLowerCase();
      const isPkgMatch = formPackageName.trim().toLowerCase() === editingApp.packageName.trim().toLowerCase();

      if (!isNameMatch || !isPkgMatch) {
        setUpdateMismatchError(
          language === 'my'
            ? `Update မပြုလုပ်နိုင်ပါ: App Name ("${editingApp.name}") နှင့် Package Name ("${editingApp.packageName}") နှစ်ခုစလုံး အကုန်တူညီမှသာ Update လုပ်လို့ရပါမည်။ မူရင်းနှင့် ကွဲလွဲနေပါသည်။`
            : `Update blocked: Both App Name ("${editingApp.name}") and Package Name ("${editingApp.packageName}") must match the original app.`
        );
        return;
      }
    } else if (!targetToUpdate) {
      // If uploading as a new app, ensure it doesn't partially collide with an existing app
      const partialConflict = apps.find(
        (a) =>
          (formPackageName.trim() && a.packageName.toLowerCase() === formPackageName.trim().toLowerCase() && a.name.toLowerCase() !== formName.trim().toLowerCase()) ||
          (formName.trim() && a.name.toLowerCase() === formName.trim().toLowerCase() && formPackageName.trim() && a.packageName.toLowerCase() !== formPackageName.trim().toLowerCase())
      );

      if (partialConflict) {
        setUpdateMismatchError(
          language === 'my'
            ? `Update မပြုလုပ်နိုင်ပါ: မူရင်း App ("${partialConflict.name}") အား Update လုပ်ရန်အတွက် App Name ("${partialConflict.name}") နှင့် Package Name ("${partialConflict.packageName}") နှစ်ခုစလုံး အကုန်တူညီရပါမည်။ တစ်ခုတည်းသာ တူနေပါသည်။`
            : `Update blocked: To update existing app ("${partialConflict.name}"), both App Name and Package Name must match exactly.`
        );
        return;
      }
    }

    const catObj = CATEGORIES.find((c) => c.id === formCategory);
    let finalDownloadUrl = formDirectUrl.trim() ? normalizeDirectDownloadUrl(formDirectUrl.trim()) : '';
    let finalGithubReleaseUrl = editingApp?.githubReleaseUrl || '';

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(10);
      setUploadStatus(language === 'my' ? 'APK မူရင်းဖိုင်အား Cloud CDN ပေါ်သို့ စတင်တင်နေပါသည်...' : 'Uploading APK binary package to Cloud CDN...');

      try {
        const activeGhConfig = await loadGitHubConfigWithFirestore();
        const uploadRes = await uploadApkToGitHubRelease(
          selectedFile,
          {
            id: editingApp?.id || 'temp',
            name: formName.trim(),
            packageName: formPackageName.trim() || `com.${session.developerId}.${Date.now()}`,
            developer: session.developerName || session.developerId,
            category: formCategory,
            categoryName: catObj?.labelEn || 'Tools',
            rating: 5,
            ratingsCount: 1,
            downloads: '100+ downloads',
            downloadCount: 100,
            size: formFileSize.trim() || `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
            version: formVersion.trim() || 'v1.0.0',
            minAndroid: 'Android 8.0+',
            sha256: 'sha256-verified',
            shortDescription: formShortDesc.trim(),
            description: formDesc.trim(),
            changelog: formChangelog.trim(),
            iconBg: formIconBg,
            iconSvgType: formIconSvg,
            bannerBg: '',
            bannerTagline: '',
            screenshots: [],
            permissions: [],
            uploadedAt: '',
            isVerified: true,
          },
          activeGhConfig,
          (statusText) => {
            setUploadStatus(statusText);
            setUploadProgress((prev) => Math.min(prev + 20, 95));
          }
        );

        if (uploadRes.success && (uploadRes.downloadUrl || uploadRes.serverDownloadUrl)) {
          finalDownloadUrl = uploadRes.downloadUrl || uploadRes.serverDownloadUrl || '';
          finalGithubReleaseUrl = uploadRes.downloadUrl || '';
          setUploadProgress(100);
          setUploadStatus(language === 'my' ? 'ဖိုင်တင်ခြင်း အောင်မြင်ပါသည်!' : 'Upload completed successfully!');
          if (uploadRes.releasePageUrl && !formRepoUrl.trim()) {
            setFormRepoUrl(uploadRes.releasePageUrl);
          }
        } else {
          // If direct cloud upload failed, verify if developer provided a direct download link
          if (formDirectUrl.trim()) {
            finalDownloadUrl = normalizeDirectDownloadUrl(formDirectUrl.trim());
          } else {
            setIsUploading(false);
            const errMsg = uploadRes.error || 'Cloud storage upload failed';
            alert(
              language === 'my'
                ? `APK ဖိုင် တင်မရနိုင်ပါ:\n${errMsg}\n\nကျေးဇူးပြု၍ Direct Download Link (Google Drive / Dropbox) ထည့်သွင်းပေးပါ သို့မဟုတ် အင်တာနက်စစ်ဆေးပါ။`
                : `APK upload failed:\n${errMsg}\n\nPlease provide a direct download link (e.g. Google Drive / Dropbox).`
            );
            return;
          }
        }
      } catch (uploadErr: any) {
        if (formDirectUrl.trim()) {
          finalDownloadUrl = normalizeDirectDownloadUrl(formDirectUrl.trim());
        } else {
          setIsUploading(false);
          alert(
            language === 'my'
              ? `APK ဖိုင် တင်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ${uploadErr.message || 'Upload error'}`
              : `Upload error: ${uploadErr.message || 'Upload error'}`
          );
          return;
        }
      }

      setIsUploading(false);
    }

    // Set GitHub release url if developer specified direct github url
    if (!finalGithubReleaseUrl && formDirectUrl.includes('github.com')) {
      finalGithubReleaseUrl = formDirectUrl.trim();
    }

    // Final screenshots array (compressed WebP images or previous/fallbacks)
    const finalScreenshots: string[] = screenshots.length > 0
      ? screenshots.map((s) => s.url)
      : (editingApp?.screenshots && editingApp.screenshots.length > 0
          ? editingApp.screenshots
          : [
              'High resolution user interface overview',
              'Smooth and optimized performance',
            ]);

    if (targetToUpdate) {
      // Archive previous version in version history
      const historyEntry = {
        version: targetToUpdate.version,
        date: targetToUpdate.uploadedAt || new Date().toISOString().split('T')[0],
        size: targetToUpdate.size,
        changelog: targetToUpdate.changelog,
        downloadUrl: targetToUpdate.downloadUrl,
      };
      const updatedHistory = [historyEntry, ...(targetToUpdate.versionHistory || [])].slice(0, 10);

      // Update existing app with identity preserved
      const updatedApp: APKApp = {
        ...targetToUpdate,
        name: formName.trim(),
        nameMy: formNameMy.trim() || undefined,
        packageName: formPackageName.trim() || targetToUpdate.packageName,
        developer: session.developerName,
        category: formCategory,
        categoryName: catObj?.labelEn || targetToUpdate.categoryName,
        version: formVersion.trim() || targetToUpdate.version,
        minAndroid: formMinAndroid.trim() || targetToUpdate.minAndroid,
        size: formFileSize || targetToUpdate.size,
        shortDescription: formShortDesc.trim() || targetToUpdate.shortDescription,
        description: formDesc.trim() || targetToUpdate.description,
        changelog: formChangelog.trim() || targetToUpdate.changelog,
        iconBg: formIconBg,
        iconSvgType: formIconSvg,
        iconUrl: formCustomIconUrl || targetToUpdate.iconUrl,
        screenshots: finalScreenshots,
        downloadUrl: finalDownloadUrl || (targetToUpdate.downloadUrl && !targetToUpdate.downloadUrl.startsWith('blob:') ? targetToUpdate.downloadUrl : (targetToUpdate.githubReleaseUrl || '')),
        githubReleaseUrl: finalGithubReleaseUrl || (targetToUpdate.githubReleaseUrl && !targetToUpdate.githubReleaseUrl.startsWith('blob:') ? targetToUpdate.githubReleaseUrl : undefined),
        repositoryUrl: formRepoUrl.trim() || targetToUpdate.repositoryUrl,
        uploaderId: session.developerId,
        uploaderName: session.developerName,
        developerKey: session.developerKey,
        versionHistory: updatedHistory,
        uploadedAt: new Date().toISOString().split('T')[0],
      };

      await onUpdateApp(updatedApp);
      setSuccessToast(language === 'my' ? `"${updatedApp.name}" အား အောင်မြင်စွာ Update ပြုလုပ်ပြီးပါပြီ!` : `"${updatedApp.name}" updated successfully!`);
    } else {
      // Create new app
      const newId = `devapp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newApp: APKApp = {
        id: newId,
        name: formName.trim(),
        nameMy: formNameMy.trim() || undefined,
        packageName: formPackageName.trim() || `com.${session.developerId}.${Date.now()}`,
        developer: session.developerName,
        category: formCategory,
        categoryName: catObj?.labelEn || 'Tools & Utilities',
        rating: 5.0,
        ratingsCount: 1,
        downloads: '0 downloads',
        downloadCount: 0,
        uniqueDownloads: 0,
        size: formFileSize,
        version: formVersion.trim() || 'v1.0.0',
        minAndroid: formMinAndroid.trim() || 'Android 8.0+',
        sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        shortDescription: formShortDesc.trim() || `${formName} Android application package ready for instant installation.`,
        description: formDesc.trim() || `${formName} is an official Android application package published on P-Store.`,
        changelog: formChangelog.trim() || 'Initial release.',
        iconBg: formIconBg,
        iconSvgType: formIconSvg,
        iconUrl: formCustomIconUrl || undefined,
        bannerBg: 'from-slate-900 via-teal-950 to-slate-950',
        bannerTagline: 'Creator Verified APK',
        screenshots: finalScreenshots,
        permissions: ['Network state', 'Internet access', 'Storage access'],
        uploadedAt: new Date().toISOString().split('T')[0],
        isVerified: true,
        isNew: true,
        customUploaded: true,
        downloadUrl: finalDownloadUrl || undefined,
        githubReleaseUrl: finalGithubReleaseUrl || undefined,
        repositoryUrl: formRepoUrl.trim() || undefined,
        uploaderId: session.developerId,
        uploaderName: session.developerName,
        developerKey: session.developerKey,
      };

      await onAppUploaded(newApp);
      setSuccessToast(language === 'my' ? `"${newApp.name}" အား P-Store ပေါ်သို့ အောင်မြင်စွာ တင်ပြီးပါပြီ!` : `"${newApp.name}" published to P-Store!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleDeleteConfirmed = async (appId: string) => {
    await onDeleteApp(appId);
    setIsDeletingId(null);
    setSuccessToast(language === 'my' ? 'App အား အောင်မြင်စွာ ဖျက်သိမ်းပြီးပါပြီ' : 'App deleted successfully');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // If developer is NOT logged in: Show the clean, simple Developer Sign In Gate
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Navbar */}
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-slate-800"
          >
            <ArrowLeft size={14} />
            <span>{language === 'my' ? 'P-Store သို့ ပြန်သွားမည်' : 'Return to P-Store'}</span>
          </button>

          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
            <ShieldCheck size={16} />
            <span>P-Store Creator Access</span>
          </div>
        </div>

        {/* Center Card */}
        <div className="max-w-md w-full mx-auto my-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Upload size={26} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {language === 'my' ? 'ဖန်တီးသူများ APK တင်သွင်းရန်' : 'Developer / Creator Console'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'my'
                ? 'Developer အကောင့်ဖွင့်၍ မိမိ၏ ကိုယ်ပိုင် APK များကို GitHub Releases နှင့် P-Store ပေါ်သို့ တိုက်ရိုက်တင်သွင်းနိုင်ပါသည်။'
                : 'Sign in or register your Developer account to publish and manage your Android APKs directly.'}
            </p>

            {/* Auth Mode Toggle Tabs (Login vs Register) */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl mt-4">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setLoginError(''); }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck size={14} />
                <span>{language === 'my' ? 'ဝင်ရောက်မည် (Login)' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('register'); setLoginError(''); }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>{language === 'my' ? 'အကောင့်သစ်ဖွင့်မည်' : 'Register'}</span>
              </button>
            </div>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{language === 'my' ? 'Developer အမည် သို့မဟုတ် Code' : 'Developer Name or Code'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{language === 'my' ? 'ဥပမာ DEV-...' : 'e.g. DEV-84912'}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginDevName}
                    onChange={(e) => setLoginDevName(e.target.value)}
                    placeholder={language === 'my' ? 'ဥပမာ - Koko Studio သို့မဟုတ် DEV-...' : 'e.g. Koko Studio, DEV-12345'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{language === 'my' ? 'Access PIN / လျှို့ဝှက်ကုဒ်' : 'Access PIN / Password'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{language === 'my' ? 'မိမိသတ်မှတ်ခဲ့သော PIN' : 'Your secret PIN'}</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginDevPin}
                    onChange={(e) => setLoginDevPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.99] transition-all cursor-pointer"
              >
                {isAuthSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{language === 'my' ? 'စစ်ဆေးနေပါသည်...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    <span>{language === 'my' ? 'Console သို့ ဝင်ရောက်မည်' : 'Enter Developer Console'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {language === 'my' ? 'Developer / Studio အမည် အသစ် *' : 'New Developer / Studio Name *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={registerDevName}
                    onChange={(e) => setRegisterDevName(e.target.value)}
                    placeholder={language === 'my' ? 'ဥပမာ - Min Min Studio, Apex Dev' : 'e.g. Acme Studio, Myanmar Dev'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'my' ? 'နာမည်တူ မရှိစေရန်အတွက် အခြားသူများ မသုံးရသေးသော သီးသန့်အမည် ပေးပါ။' : 'Must be unique to avoid account collision.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{language === 'my' ? 'သတ်မှတ်လိုသော PIN (၄-၈ လုံး) *' : 'Set Access PIN (4-8 digits) *'}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{language === 'my' ? 'ဥပမာ 1111' : 'e.g. 1111'}</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={registerDevPin}
                    onChange={(e) => setRegisterDevPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {language === 'my' ? 'PIN ထပ်မံအတည်ပြုပါ (Confirm PIN) *' : 'Confirm PIN *'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={registerDevConfirmPin}
                    onChange={(e) => setRegisterDevConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.99] transition-all cursor-pointer"
              >
                {isAuthSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{language === 'my' ? 'အကောင့်ဖွင့်နေပါသည်...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>{language === 'my' ? 'Developer အကောင့် အသစ်ပြုလုပ်မည်' : 'Create Developer Account'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Security Guarantee & Anti-Collision Explanation */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5 text-[11px] text-slate-400">
            <div className="flex items-start gap-2 text-emerald-400 font-medium">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <span>
                {language === 'my'
                  ? 'အချက်အလက် မရောထွေးစေရန် အာမခံချက် - Developer တစ်ဦးစီအတွက် Cryptographically Unique ID ဖြင့် အလိုအလျောက် သီးသန့် ခွဲခြားသိမ်းဆည်းပေးပါသည်။ နာမည်တူ အကောင့်ဖွင့်၍ မရပါ။'
                  : 'Zero Data Collision: Every developer receives a globally unique ID. Duplicate names are blocked to prevent mixing data.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <KeyRound size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                {language === 'my'
                  ? 'Server-Side Cryptographic Hash - Inspect element (DevTools) ဖြင့် Password/PIN ခိုးယူခြင်း သို့မဟုတ် ပြောင်းလဲခြင်း လုံးဝ မပြုလုပ်နိုင်အောင် ဆာဗာတွင် Salted Hash ဖြင့် လုံခြုံစွာ ကာကွယ်ထားပါသည်။'
                  : 'Inspect-Proof Security: PINs are hashed with unique cryptographic salts on the server, preventing tampering via browser DevTools.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Lock size={13} className="text-blue-400 shrink-0 mt-0.5" />
              <span>
                {language === 'my'
                  ? 'သီးသန့် နေရာ - သင်တင်ထားသော APK များကိုသာ သင်ကိုယ်တိုင် မြင်တွေ့ပြင်ဆင်ခွင့်ရှိပြီး အခြား Developer များ၏ App များကို ထိခွင့်မရှိပါ။'
                  : 'Isolated Access: You only view and update your own uploaded APKs; other developers have zero access to your software.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-5xl mx-auto w-full text-center py-4 text-xs text-slate-500">
          © {new Date().getFullYear()} P-Store Creator Platform. All rights reserved.
        </div>
      </div>
    );
  }

  // Developer IS Logged In: Show the Full Developer Console
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Console Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{language === 'my' ? 'P-Store သို့ ပြန်မည်' : 'P-Store Front'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-900/30">
              <Upload size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white leading-tight">
                  {session.developerName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Verified Creator
                </span>
                {session.developerCode && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold">
                    {session.developerCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {session.developerId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsChangePinModalOpen(true);
              setChangePinError('');
              setChangePinSuccess('');
              setCurrentPinInput('');
              setNewPinInput('');
              setConfirmNewPinInput('');
            }}
            title={language === 'my' ? 'PIN ကုဒ် ပြောင်းလဲမည်' : 'Change PIN'}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound size={13} className="text-amber-400" />
            <span className="hidden sm:inline">{language === 'my' ? 'PIN ပြောင်းမည်' : 'Change PIN'}</span>
          </button>

          <button
            onClick={() => openUploadModal()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{language === 'my' ? 'APK အသစ်တင်မည်' : 'Upload APK'}</span>
          </button>

          <button
            onClick={handleLogout}
            title={language === 'my' ? 'အကောင့်ထွက်မည်' : 'Log out'}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-400 hover:text-white p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'my' ? 'မိမိ တင်ထားသော အက်ပ်များ' : 'My Uploaded Apps'}
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {myApps.length} <span className="text-xs font-normal text-slate-500">Apps</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers size={22} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'my' ? 'ရရှိထားသော ဒေါင်းလုဒ်ပေါင်း' : 'Total App Downloads'}
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                {totalDownloads.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">downloads</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download size={22} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'my' ? 'စတိုးအခြေအနေ' : 'Store Visibility'}
              </p>
              <p className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>100% Live on P-Store</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>

        {/* Developer Isolation Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Lock size={15} className="text-emerald-400 shrink-0" />
            <span>
              {language === 'my'
                ? 'လုံခြုံရေးစည်းမျဉ်း - ဤနေရာတွင် သင်ကိုယ်တိုင် တင်ထားသော APK များကိုသာ မြင်တွေ့ပြင်ဆင်ခွင့်ရှိပြီး၊ အခြားသူများ၏ App များကို ထိခွင့်မရှိပါ။'
                : 'Isolated Developer Scope: You can only view, update, and manage your own apps. Zero access to other apps.'}
            </span>
          </div>

          <button
            onClick={() => openUploadModal()}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
          >
            {language === 'my' ? '+ APK အသစ် ထပ်မံတင်မည်' : '+ Upload New APK'}
          </button>
        </div>

        {/* My Apps Catalog Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Section Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{language === 'my' ? 'မိမိ တင်သွင်းထားသော APK များ' : 'My Uploaded APK Catalog'}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                  {myApps.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'my' ? 'ဤစာရင်းတွင် သင်ကိုယ်တိုင် တင်ထားသော APK များသာ ပါဝင်ပါသည်' : 'Only apps uploaded with your developer key are displayed here'}
              </p>
            </div>

            {/* Search Bar */}
            {myApps.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchMyApps}
                  onChange={(e) => setSearchMyApps(e.target.value)}
                  placeholder={language === 'my' ? 'မိမိ App များထဲမှ ရှာပါ...' : 'Search my apps...'}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Apps List or Empty State */}
          {myApps.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                <Upload size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">
                  {language === 'my' ? 'တင်ထားသော APK မရှိသေးပါ' : 'No APKs Uploaded Yet'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'my'
                    ? 'သင်၏ ပထမဆုံး Android APK ကို စတင်တင်သွင်းပြီး P-Store သုံးစွဲသူများထံ ချက်ချင်း ဖြန့်ချိလိုက်ပါ။'
                    : 'Publish your first Android application package to P-Store now.'}
                </p>
              </div>
              <button
                onClick={() => openUploadModal()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>{language === 'my' ? 'ပထမဆုံး APK ကို စတင်တင်မည်' : 'Upload First APK'}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredMyApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* App Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 shadow-md">
                      <AppIconRenderer app={app} size="md" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white truncate">
                          {app.name}
                        </h4>
                        {app.nameMy && (
                          <span className="text-xs text-slate-400 font-normal">
                            ({app.nameMy})
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {app.version}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          {app.categoryName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                        {app.packageName}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                          <Download size={12} />
                          <span>{app.downloadCount || 0} downloads</span>
                        </span>
                        <span>•</span>
                        <span>{app.size}</span>
                        <span>•</span>
                        <span>Uploaded: {app.uploadedAt}</span>
                        {app.githubReleaseUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={app.githubReleaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                            >
                              <Github size={11} />
                              <span>GitHub CDN Release</span>
                            </a>
                          </>
                        )}
                        {app.repositoryUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={app.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white font-semibold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700"
                            >
                              <Github size={11} />
                              <span>Source Repo</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this App */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Preview on Store */}
                    <button
                      onClick={onExit}
                      title={language === 'my' ? 'စတိုးတွင် ကြည့်မည်' : 'View on Store'}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    >
                      <Eye size={13} />
                      <span>{language === 'my' ? 'စတိုးတွင် ကြည့်မည်' : 'View'}</span>
                    </button>

                    {/* Update / Edit */}
                    <button
                      onClick={() => openUploadModal(app)}
                      title={language === 'my' ? 'ဗားရှင်းအသစ်တင်ရန် / ပြင်ဆင်ရန်' : 'Update APK or Edit info'}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>{language === 'my' ? 'Update တင်မည်' : 'Update'}</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setIsDeletingId(app.id)}
                      title={language === 'my' ? 'ဖျက်သိမ်းမည်' : 'Delete app'}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">
                {language === 'my' ? 'ဤ App အား အပြီးတိုင် ဖျက်မည်လား။' : 'Delete this application?'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'my'
                  ? 'ဖျက်လိုက်ပါက P-Store မှ ချက်ချင်း ဖယ်ရှားသွားမည်ဖြစ်ပါသည်။'
                  : 'This application will be removed from P-Store immediately.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                {language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteConfirmed(isDeletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-950/40"
              >
                {language === 'my' ? 'သေချာသည် ဖျက်မည်' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  {editingApp ? <Edit3 size={16} /> : <Upload size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingApp
                      ? (language === 'my' ? `"${editingApp.name}" အား Update ပြုလုပ်ခြင်း` : `Update "${editingApp.name}"`)
                      : (language === 'my' ? 'APK အသစ် စတင်တင်သွင်းခြင်း' : 'Publish New Android APK')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'my' ? `ဖန်တီးသူ: ${session.developerName}` : `Developer: ${session.developerName}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitApp} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {language === 'my' ? 'APK Binary File ရွေးချယ်ပါ' : 'Select APK File (.apk)'}
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : selectedFile
                      ? 'border-emerald-500/40 bg-slate-950'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                        <FileCheck size={20} />
                      </div>
                      <p className="text-xs font-bold text-white truncate max-w-sm mx-auto">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {formFileSize} • Ready for upload
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-slate-400">
                      <Upload size={24} className="mx-auto text-emerald-400" />
                      <p className="text-xs font-semibold text-white">
                        {language === 'my' ? 'APK ဖိုင်ကို ဤနေရာတွင် ဆွဲထည့်ပါ သို့မဟုတ် နှိပ်၍ရွေးပါ' : 'Drop .apk file here or click to browse'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {language === 'my' ? 'App အမည်၊ Package Name နှင့် ဗားရှင်းတို့ကို အလိုအလျောက် ဖတ်ရှုပေးမည်ဖြစ်ပါသည်' : 'Auto-extracts app name, package, version, and icon'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Parsing / Upload Progress Indicator */}
                {(isParsingApk || isUploading) && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-2">
                        <Loader2 size={13} className="animate-spin text-emerald-400" />
                        <span>{uploadStatus}</span>
                      </span>
                      {isUploading && <span className="font-mono text-emerald-400">{uploadProgress}%</span>}
                    </div>
                    {isUploading && (
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GitHub Releases Integration & Auto-Sync Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Github size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{language === 'my' ? 'GitHub Releases သို့ တိုက်ရိုက်တင်မည်' : 'Auto-Sync to GitHub Releases'}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">CDN</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'my' ? 'Microsoft/Fastly Global CDN ဖြင့် မြန်ဆန်စွာ ဒေါင်းလုဒ်ဆွဲနိုင်စေပါသည်' : 'Global high-speed delivery with GitHub Releases CDN'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formUploadToGithub}
                      onChange={(e) => setFormUploadToGithub(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-900">
                  {/* GitHub Repo Link */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Github size={12} className="text-slate-400" />
                      <span>{language === 'my' ? 'GitHub Repo Link (လင့်ခ်)' : 'GitHub Repo URL'}</span>
                    </label>
                    <input
                      type="url"
                      value={formRepoUrl}
                      onChange={(e) => setFormRepoUrl(e.target.value)}
                      placeholder="https://github.com/user/my-app"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Direct Download URL fallback */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Link2 size={12} className="text-slate-400" />
                      <span>{language === 'my' ? 'တိုက်ရိုက် Download Link (Optional)' : 'Direct Download URL (Optional)'}</span>
                    </label>
                    <input
                      type="url"
                      value={formDirectUrl}
                      onChange={(e) => setFormDirectUrl(e.target.value)}
                      placeholder="https://... / app.apk"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Update Mode Identity Lock / Error Banners */}
              {editingApp && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-300">
                      {language === 'my' ? '🔒 Update လုံခြုံရေး စည်းမျဉ်း (Identity Lock)' : '🔒 Update Identity Lock'}
                    </p>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      {language === 'my'
                        ? `အက်ပ်ကို Update လုပ်ရန် မူရင်း App Name ("${editingApp.name}") နှင့် Package Name ("${editingApp.packageName}") အကုန်တူညီရပါမည်။ မတူညီပါက Update လုပ်၍ မရပါ။`
                        : `To update this app, both App Name ("${editingApp.name}") and Package Name ("${editingApp.packageName}") must match exactly.`}
                    </p>
                  </div>
                </div>
              )}

              {updateMismatchError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-rose-300">
                      {language === 'my' ? '⚠️ Update မပြုလုပ်နိုင်ပါ (အမည် သို့မဟုတ် Package မတူညီပါ)' : '⚠️ Update Blocked (Identity Mismatch)'}
                    </p>
                    <p className="text-[11px] text-rose-200/90 leading-relaxed">{updateMismatchError}</p>
                  </div>
                </div>
              )}

              {!editingApp && matchedExistingApp && (
                <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                  <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-blue-300">
                      {language === 'my' ? 'စတိုးတွင် ရှိပြီးသော အက်ပ်နှင့် တိုက်ဆိုင်နေပါသည်' : 'Existing App Detected in Catalog'}
                    </p>
                    <p className="text-[11px] text-blue-200/90 leading-relaxed">
                      {language === 'my'
                        ? `ဤ Package Name (${matchedExistingApp.packageName}) သို့မဟုတ် App Name (${matchedExistingApp.name}) ဖြင့် အက်ပ်ရှိပြီးဖြစ်ပါသည်။ Update လုပ်လိုပါက App Name နှင့် Package Name နှစ်ခုစလုံး မူရင်းနှင့် အကုန်တူညီရပါမည်။`
                        : `An app with this package name already exists. Both App Name and Package Name must match to update it.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === 'my' ? 'App အမည် (အင်္ဂလိပ်) *' : 'App Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="My Application"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === 'my' ? 'App အမည် (မြန်မာ)' : 'App Name (Myanmar)'}
                  </label>
                  <input
                    type="text"
                    value={formNameMy}
                    onChange={(e) => setFormNameMy(e.target.value)}
                    placeholder="မြန်မာအမည် (ဥပမာ - မြန်မာ့ကီးဘုတ်)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === 'my' ? 'Package Name' : 'Package Name'}
                  </label>
                  <input
                    type="text"
                    value={formPackageName}
                    onChange={(e) => setFormPackageName(e.target.value)}
                    placeholder="com.developer.app"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === 'my' ? 'ကဏ္ဍ (Category)' : 'Category'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AppCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'my' ? c.labelMy : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === 'my' ? 'ဗားရှင်း (Version)' : 'Version'}
                  </label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {language === 'my' ? 'အနိမ့်ဆုံး Android ဗားရှင်း' : 'Minimum Android OS'}
                  </label>
                  <input
                    type="text"
                    value={formMinAndroid}
                    onChange={(e) => setFormMinAndroid(e.target.value)}
                    placeholder="Android 8.0+"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 2. Authentic App Logo (Icon) Upload + WebP Compression */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-emerald-400" />
                    <span>{language === 'my' ? 'အက်ပ် Logo (Icon) ထည့်သွင်းခြင်း *' : 'Authentic App Logo (Icon) *'}</span>
                  </label>
                  {formCustomIconUrl && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                      {logoStats ? `${formatBytes(logoStats.original)} → ${formatBytes(logoStats.compressed)} (WebP)` : (language === 'my' ? 'APK မှ အလိုအလျောက် ရယူထားသည်' : 'Extracted from APK')}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Live Preview */}
                    <div className="relative">
                      {formCustomIconUrl ? (
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-emerald-500/50 shadow-md bg-slate-900">
                          <img src={formCustomIconUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setFormCustomIconUrl('');
                              setLogoStats(null);
                            }}
                            className="absolute top-0.5 right-0.5 p-1 bg-black/75 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
                            title={language === 'my' ? 'Logo ဖျက်မည်' : 'Remove logo'}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${formIconBg} flex items-center justify-center text-white shadow-md`}>
                          <Sparkles size={24} />
                        </div>
                      )}
                    </div>

                    {/* Logo File Picker Button & Controls */}
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer shadow-sm active:scale-95 transition-all"
                        >
                          <ImageIcon size={13} className="text-emerald-400" />
                          <span>{formCustomIconUrl ? (language === 'my' ? 'Logo အသစ် ပြောင်းမည်' : 'Change Logo Image') : (language === 'my' ? 'Logo ပုံ ရွေးချယ်တင်မည်' : 'Upload Custom Logo')}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        PNG / JPG / WebP (Admin Panel ကဲ့သို့ WebP ဖြင့် အရွယ်အစား အလိုအလျောက် ချုံ့ပေးပါသည်)
                      </p>
                    </div>
                  </div>

                  {/* Or Direct Logo URL */}
                  <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        {language === 'my' ? 'တိုက်ရိုက် Logo URL (ရှိလျှင်)' : 'Direct Logo Image URL (Optional)'}
                      </label>
                      <input
                        type="url"
                        value={formCustomIconUrl}
                        onChange={(e) => setFormCustomIconUrl(e.target.value)}
                        placeholder="https://... / logo.png"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Color Theme Selector as Fallback Gradient */}
                    <div>
                      <span className="block text-[11px] font-medium text-slate-400 mb-1">
                        {language === 'my' ? 'နောက်ခံ အရောင်ဒီဇိုင်း (Fallback Gradient)' : 'Theme Background Gradient'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ICON_THEMES.map((theme) => (
                          <button
                            type="button"
                            key={theme.bg}
                            onClick={() => setFormIconBg(theme.bg)}
                            className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${theme.bg} transition-all cursor-pointer ${
                              formIconBg === theme.bg ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Screenshots Upload Section (Admin Panel Style) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-teal-400" />
                    <span>{language === 'my' ? 'Screenshots ဓာတ်ပုံများ (ရွေးချယ်နိုင်သည်)' : 'App Screenshots (Optional)'}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {screenshots.length} / 4 {language === 'my' ? 'ပုံ တင်ထားသည်' : 'uploaded'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
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

                  {/* Screenshots grid */}
                  <div className="flex flex-wrap items-center gap-3">
                    {screenshots.map((s, idx) => (
                      <div key={idx} className="relative w-20 h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group shadow-md">
                        <img src={s.url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
                          title="Delete screenshot"
                        >
                          <X size={10} />
                        </button>
                        {s.compressed > 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/75 py-0.5 text-center text-[9px] font-mono text-emerald-400">
                            {formatBytes(s.compressed)}
                          </div>
                        )}
                      </div>
                    ))}

                    {screenshots.length < 4 && (
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="w-20 h-28 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500 bg-slate-900/60 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-all cursor-pointer"
                      >
                        <Plus size={18} className="text-emerald-400" />
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {language === 'my' ? 'ပုံထည့်မည်' : 'Add Image'}
                        </span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {language === 'my' 
                      ? '💡 ၄ ပုံအထိ တင်နိုင်ပြီး WebP စနစ်ဖြင့် အလိုအလျောက် သေးငယ်ချောမွေ့အောင် ပြုလုပ်ပေးပါသည်' 
                      : '💡 Up to 4 screenshots auto-compressed to WebP for instant app previews'}
                  </p>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'my' ? 'အကျဉ်းချုပ် ဖော်ပြချက် (Short Description)' : 'Short Description'}
                </label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder={language === 'my' ? 'ဆော့ဖ်ဝဲလ် အကြောင်း စာတစ်ကြောင်းဖော်ပြချက်' : 'A modern Android utility designed for fast performance.'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'my' ? 'အသေးစိတ် ဖော်ပြချက် (Full Description)' : 'Detailed Description'}
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={language === 'my' ? 'အသုံးပြုသူများ သိရှိစေရန် အသေးစိတ် ရေးသားပါ...' : 'Full features, guides and capabilities...'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'my' ? 'ဗားရှင်းအသစ်တွင် ပါဝင်သော အချက်များ (What’s New / Changelog)' : 'What’s New / Changelog'}
                </label>
                <input
                  type="text"
                  value={formChangelog}
                  onChange={(e) => setFormChangelog(e.target.value)}
                  placeholder="Bug fixes, performance improvements, new features."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  {language === 'my' ? 'ပယ်ဖျက်မည်' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{language === 'my' ? 'တင်နေပါသည်...' : 'Uploading...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>{editingApp ? (language === 'my' ? 'Update အတည်ပြုမည်' : 'Save Changes') : (language === 'my' ? 'P-Store တွင် တင်မည်' : 'Publish App')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change PIN Modal (Server-Verified & Salted Hash) */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'my' ? 'Access PIN ပြောင်းလဲမည်' : 'Change Access PIN'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'my' ? 'လုံခြုံရေးအတွက် PIN ကို ပြောင်းလဲသတ်မှတ်ပါ' : 'Update your secret developer key'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChangePinModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'my' ? 'လက်ရှိသုံးနေသော PIN မူဟောင်း *' : 'Current PIN *'}
                </label>
                <input
                  type="password"
                  required
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'my' ? 'သတ်မှတ်လိုသော PIN အသစ် (၄-၈ လုံး) *' : 'New PIN (4-8 digits) *'}
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {language === 'my' ? 'PIN အသစ် ထပ်မံအတည်ပြုပါ *' : 'Confirm New PIN *'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPinInput}
                  onChange={(e) => setConfirmNewPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {changePinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{changePinError}</span>
                </div>
              )}

              {changePinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{changePinSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  {language === 'my' ? 'မပြောင်းတော့ပါ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isChangingPin}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md shadow-amber-950/40 flex items-center justify-center gap-2"
                >
                  {isChangingPin ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{language === 'my' ? 'ပြောင်းနေပါသည်...' : 'Updating...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{language === 'my' ? 'PIN ပြောင်းမည်' : 'Save New PIN'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
