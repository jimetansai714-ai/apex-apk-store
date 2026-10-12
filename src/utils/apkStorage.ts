import { APKApp } from '../types';

export interface ServerUploadResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  size?: number;
  error?: string;
}

/**
 * Automatically detects and converts third-party share links to direct APK download links.
 * For example:
 * - Google Drive share link: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   -> https://drive.google.com/uc?export=download&id=FILE_ID
 * - Dropbox share link: https://www.dropbox.com/s/.../app.apk?dl=0
 *   -> https://dl.dropboxusercontent.com/s/.../app.apk
 */
export function normalizeDirectDownloadUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();

  // Google Drive
  const gDriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // Dropbox
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('?dl=0')) {
      return trimmed.replace('?dl=0', '?dl=1');
    }
    if (!trimmed.includes('?dl=1')) {
      return `${trimmed}${trimmed.includes('?') ? '&' : '?'}dl=1`;
    }
  }

  return trimmed;
}

/**
 * Upload an APK binary file directly to our P-Store Express backend (/api/upload-apk)
 */
export async function uploadApkToServer(
  file: File,
  onProgress?: (percent: number, status: string) => void,
  authToken?: string
): Promise<ServerUploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        const mbLoaded = (e.loaded / (1024 * 1024)).toFixed(1);
        const mbTotal = (e.total / (1024 * 1024)).toFixed(1);
        onProgress?.(percent, `Uploading ${mbLoaded} MB / ${mbTotal} MB (${percent}%)...`);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.downloadUrl) {
            onProgress?.(100, 'Upload complete! Stored on server.');
            resolve({
              success: true,
              downloadUrl: res.downloadUrl,
              filename: res.filename,
              size: res.size,
            });
            return;
          }
          resolve({
            success: false,
            error: res.error || 'Server rejected file upload',
          });
        } catch {
          resolve({
            success: false,
            error: 'Invalid response from server',
          });
        }
      } else {
        let errMessage = `HTTP ${xhr.status}: Failed to upload APK`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error) errMessage = errRes.error;
        } catch {}
        resolve({
          success: false,
          error: errMessage,
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Network connection failed during upload',
      });
    });

    xhr.open('POST', '/api/upload-apk');
    const token = authToken || 
      localStorage.getItem('apexapk_admin_auth') || 
      sessionStorage.getItem('apexapk_admin_auth');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

/**
 * Checks if an app has a genuine, valid download link or file attached.
 */
export function hasGenuineDownloadLink(app: APKApp | null | undefined): boolean {
  if (!app) return false;
  if (app.githubReleaseUrl && app.githubReleaseUrl.trim().length > 0) return true;
  if (!app.downloadUrl) return false;
  const url = app.downloadUrl.trim();
  // Filter out webpage deep links mistakenly stored as download urls
  if (url.includes('?app=') || url.includes('?id=') || url.endsWith('.html')) {
    return false;
  }
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/uploads/') ||
    url.startsWith('/api/') ||
    url.startsWith('blob:')
  );
}
