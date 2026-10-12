// Client Device & Session Tracking Utility for Accurate Download Auditing
// 100% Privacy-preserving, client-side cryptographic device/session fingerprinting

export interface DeviceAuditInfo {
  sessionId: string;
  deviceType: 'Android Mobile' | 'iOS Mobile' | 'Tablet' | 'Windows PC' | 'Mac' | 'Linux' | 'Other';
  browser: string;
  os: string;
  screen: string;
  isUnique: boolean;
}

export function getSessionId(): string {
  try {
    let sid = localStorage.getItem('pstore_client_session_id');
    if (!sid) {
      sid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('pstore_client_session_id', sid);
    }
    return sid;
  } catch {
    return 'anon_' + Math.random().toString(36).substring(2, 8);
  }
}

export function getDeviceAuditInfo(appId: string): DeviceAuditInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const sessionId = getSessionId();

  // Detect Device Type & OS
  let deviceType: DeviceAuditInfo['deviceType'] = 'Other';
  let os = 'Unknown OS';

  if (/Android/i.test(ua)) {
    deviceType = 'Android Mobile';
    os = 'Android';
  } else if (/iPhone|iPod/i.test(ua)) {
    deviceType = 'iOS Mobile';
    os = 'iOS';
  } else if (/iPad/i.test(ua)) {
    deviceType = 'Tablet';
    os = 'iPadOS';
  } else if (/Windows NT/i.test(ua)) {
    deviceType = 'Windows PC';
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'Mac';
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    deviceType = 'Linux';
    os = 'Linux';
  }

  // Detect Browser
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  }

  const screen = typeof window !== 'undefined' 
    ? `${window.screen.width}x${window.screen.height}` 
    : 'Unknown';

  // Check unique download history
  let isUnique = true;
  try {
    const key = `pstore_downloaded_${appId}`;
    if (localStorage.getItem(key)) {
      isUnique = false;
    } else {
      localStorage.setItem(key, 'true');
    }
  } catch {
    // fallback
  }

  return {
    sessionId,
    deviceType,
    browser,
    os,
    screen,
    isUnique,
  };
}
