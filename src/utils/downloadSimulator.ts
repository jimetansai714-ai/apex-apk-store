import { APKApp } from '../types';
import { normalizeDirectDownloadUrl, hasGenuineDownloadLink } from './apkStorage';

export interface DownloadTriggerResult {
  success: boolean;
  reason?: 'missing_download_url' | 'network_error';
  url?: string;
  filename?: string;
}

export function getDownloadFilename(app: APKApp): string {
  const cleanName = (app.name || 'app').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const cleanVer = (app.version || 'v1.0.0').replace(/[^a-zA-Z0-9.]/g, '_');
  return `${cleanName}_${cleanVer}.apk`;
}

export function getDirectDownloadUrl(app: APKApp): string {
  // If app has a direct GitHub Release / Repository binary URL, prefer it as the ultimate reliable CDN link
  if (app.githubReleaseUrl && (app.githubReleaseUrl.startsWith('http://') || app.githubReleaseUrl.startsWith('https://'))) {
    return app.githubReleaseUrl.trim();
  }

  if (!app.downloadUrl) return '';
  const rawUrl = app.downloadUrl.trim();
  const normalized = normalizeDirectDownloadUrl(rawUrl);
  const filename = getDownloadFilename(app);

  // Direct GitHub download links (Releases CDN or repository raw) are global and 100% reliable
  if (normalized.includes('github.com') || normalized.includes('githubusercontent.com')) {
    return normalized;
  }

  // If running on static GitHub Pages and the URL is relative, prepend Cloud Run origin or keep safe
  if (normalized.startsWith('/api/download/')) {
    const separator = normalized.includes('?') ? '&' : '?';
    return `${normalized}${separator}name=${encodeURIComponent(filename)}`;
  }

  if (normalized.startsWith('/uploads/')) {
    // Route via high-speed API download with headers
    const uploadFilename = normalized.replace('/uploads/', '');
    return `/api/download/${uploadFilename}?name=${encodeURIComponent(filename)}`;
  }

  return normalized;
}

export const triggerActualApkDownload = (app: APKApp): DownloadTriggerResult => {
  if (!app) {
    return { success: false, reason: 'missing_download_url' };
  }

  // Check if app has a valid download URL
  if (hasGenuineDownloadLink(app)) {
    const directUrl = getDirectDownloadUrl(app);
    const filename = getDownloadFilename(app);

    // Resolve relative URLs to full origin
    const finalUrl = directUrl.startsWith('/')
      ? `${window.location.origin}${directUrl}`
      : directUrl;

    const a = document.createElement('a');
    a.href = finalUrl;
    a.setAttribute('download', filename);
    // Do NOT use _blank for attachment downloads as it opens a blank white window on mobile/desktop
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return { success: true, url: finalUrl, filename };
  }

  return {
    success: false,
    reason: 'missing_download_url',
  };
};
