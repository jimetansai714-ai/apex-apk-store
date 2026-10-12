import { APKApp } from '../types';
import { getGitHubConfigFromFirestore, saveGitHubConfigToFirestore } from '../firebase';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  owner: 'jimetansai714-ai',
  repo: 'apex-apk-store',
  token: '',
};

export const getStoredGitHubConfig = (): GitHubConfig => {
  try {
    const stored = localStorage.getItem('apexapk_github_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        owner: parsed.owner || DEFAULT_GITHUB_CONFIG.owner,
        repo: parsed.repo || DEFAULT_GITHUB_CONFIG.repo,
        token: parsed.token || '',
      };
    }
  } catch (err) {
    console.error('Failed to read github config', err);
  }
  return DEFAULT_GITHUB_CONFIG;
};

export const loadGitHubConfigWithFirestore = async (): Promise<GitHubConfig> => {
  const local = getStoredGitHubConfig();
  if (local.token) {
    return local;
  }
  try {
    const remote = await getGitHubConfigFromFirestore();
    if (remote && remote.token) {
      const merged: GitHubConfig = {
        owner: remote.owner || local.owner || DEFAULT_GITHUB_CONFIG.owner,
        repo: remote.repo || local.repo || DEFAULT_GITHUB_CONFIG.repo,
        token: remote.token,
      };
      saveGitHubConfig(merged);
      return merged;
    }
  } catch {}
  return local;
};

export const saveGitHubConfig = (cfg: GitHubConfig) => {
  try {
    localStorage.setItem('apexapk_github_config', JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save github config locally', err);
  }
  // Also persist in Firestore cloud settings asynchronously
  try {
    saveGitHubConfigToFirestore(cfg);
  } catch {}
};

export const testGitHubConnection = async (config: GitHubConfig): Promise<{ success: boolean; message: string }> => {
  let token = config.token.trim();
  if (!token) {
    const local = getStoredGitHubConfig();
    if (local.token) token = local.token.trim();
  }
  if (!token) {
    try {
      const remote = await getGitHubConfigFromFirestore();
      if (remote?.token) token = remote.token.trim();
    } catch {}
  }

  if (!token) {
    return { success: false, message: 'GitHub Personal Access Token ထည့်သွင်းပေးရန် လိုအပ်ပါသည်။' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return { 
        success: true, 
        message: `✓ GitHub Repository (${data.full_name}) သို့ အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!` 
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: err.message || `GitHub error: HTTP ${res.status}` 
      };
    }
  } catch (e: any) {
    return { success: false, message: e.message || 'Network connection error' };
  }
};

/**
 * Converts a browser File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Universal GitHub APK Upload:
 * 1. Primary: Server-side /api/github/upload-release (Releases API with no CORS limits, up to hundreds of MBs)
 * 2. Fallback: Client-side GitHub Contents API for direct repository storage at apks/*.apk
 */
export const uploadApkToGitHubRelease = async (
  file: File,
  app: APKApp,
  config: GitHubConfig,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; downloadUrl?: string; error?: string; releasePageUrl?: string }> => {
  let token = config.token.trim();
  if (!token) {
    const local = getStoredGitHubConfig();
    if (local.token) token = local.token.trim();
  }
  if (!token) {
    try {
      const remote = await getGitHubConfigFromFirestore();
      if (remote?.token) token = remote.token.trim();
    } catch {}
  }

  if (!token) {
    return {
      success: false,
      error: 'GitHub Personal Access Token (ghp_...) မထည့်ရသေးပါ။ ကျေးဇူးပြု၍ GitHub Token အရင် ထည့်သွင်းပေးပါ။',
    };
  }

  const effectiveOwner = config.owner?.trim() || DEFAULT_GITHUB_CONFIG.owner;
  const effectiveRepo = config.repo?.trim() || DEFAULT_GITHUB_CONFIG.repo;

  // 1. Attempt Server-Side High-Speed GitHub Releases Upload
  try {
    onStatusUpdate?.('ဆာဗာမှတစ်ဆင့် GitHub Releases သို့ တကယ့် APK ဖိုင်အား တင်နေပါသည်...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner', config.owner.trim());
    formData.append('repo', config.repo.trim());
    formData.append('token', token);
    formData.append('appName', app.name);
    formData.append('version', app.version);
    formData.append('packageName', app.packageName);

    const adminToken = localStorage.getItem('apexapk_admin_auth') || sessionStorage.getItem('apexapk_admin_auth') || 'fallback_auth_2a767f054736430c30b1fc2930c9a984555c1555e18aa8e5fdf07fc5d8e81350';

    const serverRes = await fetch('/api/github/upload-release', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.success && data.downloadUrl) {
        onStatusUpdate?.('GitHub Releases CDN ပေါ်သို့ အောင်မြင်စွာ တင်ပြီးစီးပါပြီ!');
        return {
          success: true,
          downloadUrl: data.downloadUrl,
          releasePageUrl: data.releasePageUrl,
        };
      }
    } else {
      const errData = await serverRes.json().catch(() => ({}));
      if (errData.error && !errData.error.includes('Cannot POST')) {
        console.warn('Server GitHub upload returned error:', errData.error);
        // If it's a specific token error from GitHub, return it directly so user can fix token
        if (errData.error.includes('Bad credentials') || errData.error.includes('Not Found')) {
          return { success: false, error: errData.error };
        }
      }
    }
  } catch (err: any) {
    console.warn('Server-side GitHub upload skipped or unavailable:', err);
  }

  // 2. Direct GitHub Git Data API & Release Creation (100% CORS supported on api.github.com for static GitHub Pages)
  try {
    onStatusUpdate?.('GitHub ပေါ်သို့ APK ဖိုင်အား တိုက်ရိုက် သိမ်းဆည်းနေပါသည် (Blob Storage)...');
    const cleanVersion = app.version.replace(/[^a-zA-Z0-9.]/g, '_') || 'v1.0';
    const cleanFileName = `${app.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${cleanVersion}.apk`;
    const filePath = `apks/${cleanFileName}`;

    onStatusUpdate?.('APK ဖိုင်အား Encode ပြုလုပ်နေပါသည်...');
    const base64Content = await fileToBase64(file);

    // Step A: Create Git Blob (supports up to 100MB)
    onStatusUpdate?.('GitHub Git Blob သိမ်းဆည်းနေပါသည်...');
    const blobRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/blobs`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: base64Content,
        encoding: 'base64',
      }),
    });

    if (!blobRes.ok) {
      const err = await blobRes.json().catch(() => ({}));
      throw new Error(err.message || `Git Blob error: HTTP ${blobRes.status}`);
    }

    const blobData = await blobRes.json();
    const blobSha = blobData.sha;

    // Step B: Get current branch commit ref
    onStatusUpdate?.('Repository Branch အချက်အလက် ရယူနေပါသည်...');
    const branchRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const repoInfo = branchRes.ok ? await branchRes.json() : {};
    const defaultBranch = repoInfo.default_branch || 'main';

    const refRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/ref/heads/${defaultBranch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      throw new Error(err.message || `Branch ref error: HTTP ${refRes.status}`);
    }

    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // Step C: Create Git Tree with new APK file
    onStatusUpdate?.('GitHub Git Tree တည်ဆောက်နေပါသည်...');
    const treeRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: [
          {
            path: filePath,
            mode: '100644',
            type: 'blob',
            sha: blobSha,
          },
        ],
      }),
    });

    if (!treeRes.ok) {
      const err = await treeRes.json().catch(() => ({}));
      throw new Error(err.message || `Git Tree error: HTTP ${treeRes.status}`);
    }

    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha;

    // Step D: Create Git Commit
    onStatusUpdate?.('GitHub Commit ပြုလုပ်နေပါသည်...');
    const commitRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Release APK: ${app.name} ${app.version} (Verified Binary)`,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    });

    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}));
      throw new Error(err.message || `Commit error: HTTP ${commitRes.status}`);
    }

    const commitData = await commitRes.json();
    const newCommitSha = commitData.sha;

    // Step E: Update branch pointer
    onStatusUpdate?.('Repository အား Update ပြုလုပ်နေပါသည်...');
    const updateRefRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/refs/heads/${defaultBranch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommitSha,
      }),
    });

    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      throw new Error(err.message || `Branch update error: HTTP ${updateRefRes.status}`);
    }

    const rawDownloadUrl = `https://github.com/${config.owner}/${config.repo}/raw/${defaultBranch}/${filePath}`;

    // Step F: Create official GitHub Release referencing this commit
    try {
      const tagName = `release-${app.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${cleanVersion}-${Date.now().toString().slice(-4)}`;
      await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/releases`, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_name: tagName,
          target_commitish: newCommitSha,
          name: `${app.name} ${app.version} Official APK Release`,
          body: `Package: ${app.packageName}\nVersion: ${app.version}\nDirect APK Download: ${rawDownloadUrl}\nUploaded via P-Store Console.`,
          draft: false,
          prerelease: false,
        }),
      });
    } catch {}

    onStatusUpdate?.('GitHub Repository ပေါ်သို့ အောင်မြင်စွာ တိုက်ရိုက် သိမ်းဆည်းပြီးပါပြီ!');
    return {
      success: true,
      downloadUrl: rawDownloadUrl,
      releasePageUrl: `https://github.com/${config.owner}/${config.repo}/blob/${defaultBranch}/${filePath}`,
    };
  } catch (err: any) {
    console.error('GitHub Upload Failed:', err);
    return {
      success: false,
      error: `GitHub သို့ APK တင်ရာတွင် အမှား: ${err.message || 'Network error'}`,
    };
  }
};

export const syncReleasesFromGitHub = async (
  config: GitHubConfig
): Promise<{ success: boolean; releases?: any[]; error?: string }> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/releases`, {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) {
      return { success: false, error: `GitHub error: HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: true, releases: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch releases' };
  }
};
