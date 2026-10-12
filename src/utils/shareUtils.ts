import { APKApp } from '../types';

/**
 * Generates direct share URL for an app package
 */
export function getAppShareUrl(app: APKApp): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?app=${encodeURIComponent(app.id)}`;
}

/**
 * Copies the unique direct share link to clipboard
 */
export async function copyAppShareUrl(app: APKApp): Promise<boolean> {
  const url = getAppShareUrl(app);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fallback to document.execCommand
  }

  try {
    const input = document.createElement('input');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    const success = document.execCommand('copy');
    document.body.removeChild(input);
    return success;
  } catch {
    return false;
  }
}

/**
 * Formats download count accurately with exact numbers (e.g. ၁ ယောက်, ၂ ယောက်, 1 download, 2 downloads)
 */
export function formatExactDownloads(count: number, language: 'en' | 'my' = 'my'): string {
  const num = Math.max(0, count || 0);
  if (language === 'my') {
    const myanmarDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    const myNum = num.toString().split('').map((d) => myanmarDigits[parseInt(d)] || d).join('');
    return `${myNum} ယောက်`;
  }
  return num === 1 ? '1 Download' : `${num.toLocaleString()} Downloads`;
}

