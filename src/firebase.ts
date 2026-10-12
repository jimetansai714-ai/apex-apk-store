import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  onSnapshot, 
  getDocs,
  getDocFromServer,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { APKApp, AppReview, DownloadAuditLog } from './types';
import { getDeviceAuditInfo } from './utils/deviceTracker';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with experimentalForceLongPolling to guarantee rock-solid connectivity in iFrames
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test per Firebase skill instructions
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (
      error instanceof Error && 
      (error.message.includes('the client is offline') || error.message.includes('unavailable'))
    ) {
      console.warn('Firestore operating in offline cache mode until connection resolves.');
      return false;
    }
    return true;
  }
}

// Firestore Realtime Catalog Listener with resilient fallback
export function subscribeToAppsCatalog(
  onUpdate: (apps: APKApp[]) => void,
  onError?: (err: any) => void
) {
  const appsCol = collection(db, 'apps');
  return onSnapshot(
    appsCol,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const list: APKApp[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as APKApp);
      });
      onUpdate(list);
    },
    (error) => {
      // If temporary backend unavailability, log notice and do not throw uncaught error
      handleFirestoreError(error, OperationType.GET, 'apps');
      onError?.(error);
    }
  );
}

// Save or Update App in Firestore
export async function saveAppToFirestore(app: APKApp): Promise<void> {
  const path = `apps/${app.id}`;
  try {
    const cleanApp = JSON.parse(JSON.stringify(app)); // strips any undefined fields for Firestore
    await setDoc(doc(db, 'apps', app.id), cleanApp);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete App from Firestore
export async function deleteAppFromFirestore(appId: string): Promise<void> {
  const path = `apps/${appId}`;
  try {
    await deleteDoc(doc(db, 'apps', appId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Record an exact download event in Firestore with audit logging
export async function recordAppDownload(
  appId: string,
  options?: { source?: string; version?: string }
): Promise<number> {
  const appRef = doc(db, 'apps', appId);
  try {
    const snap = await getDoc(appRef);
    if (snap.exists()) {
      const data = snap.data() as APKApp;
      const currentCount = Number(data.downloadCount) || 0;
      const currentUnique = Number(data.uniqueDownloads) || 0;
      
      const audit = getDeviceAuditInfo(appId);
      const isUnique = audit.isUnique;
      const newCount = currentCount + 1;
      const newUnique = isUnique ? (currentUnique + 1) : Math.max(1, currentUnique);
      const nowIso = new Date().toISOString();
      const unixTime = Date.now();
      const logId = `dl_${unixTime}_${Math.random().toString(36).substring(2, 7)}`;

      const logDoc: DownloadAuditLog = {
        id: logId,
        appId,
        appName: data.name || 'APK App',
        timestamp: nowIso,
        unixTime,
        sessionId: audit.sessionId,
        deviceType: audit.deviceType,
        browser: audit.browser,
        os: audit.os,
        screen: audit.screen,
        isUnique,
        version: options?.version || data.version || 'v1.0.0',
        source: options?.source || 'Storefront Download',
      };

      // 1. Write audit log entry
      try {
        const logRef = doc(db, 'apps', appId, 'download_logs', logId);
        await setDoc(logRef, logDoc);
      } catch (logErr) {
        console.warn('Notice saving download audit log:', logErr);
      }

      // 2. Update app stats
      await updateDoc(appRef, {
        downloadCount: newCount,
        uniqueDownloads: newUnique,
        downloads: `${newCount} downloads`,
        lastDownloadAt: nowIso,
      });

      return newCount;
    }
  } catch (error) {
    console.warn('Notice while updating download count in Firestore:', error);
  }
  return 0;
}

// Subscribe to real-time download logs for an app (newest first, limit 50)
export function subscribeToDownloadLogs(
  appId: string,
  onUpdate: (logs: DownloadAuditLog[]) => void
) {
  const logsCol = collection(db, 'apps', appId, 'download_logs');
  const q = query(logsCol, orderBy('unixTime', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: DownloadAuditLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DownloadAuditLog);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Download logs subscription notice:', err);
    }
  );
}

// Clear all download logs and reset count to 0 for an app
export async function clearAppDownloadLogs(appId: string): Promise<void> {
  const logsCol = collection(db, 'apps', appId, 'download_logs');
  const snapshot = await getDocs(logsCol);
  for (const d of snapshot.docs) {
    await deleteDoc(d.ref);
  }
  const appRef = doc(db, 'apps', appId);
  await updateDoc(appRef, {
    downloadCount: 0,
    uniqueDownloads: 0,
    downloads: '0 downloads',
  });
}

// Subscribe to real-time reviews for a specific app
export function subscribeToAppReviews(
  appId: string,
  onUpdate: (reviews: AppReview[]) => void
) {
  const reviewsCol = collection(db, 'apps', appId, 'reviews');
  return onSnapshot(
    reviewsCol,
    (snapshot) => {
      const list: AppReview[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AppReview);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('Reviews subscription notice:', err);
    }
  );
}

// Save a review to Firestore and recalculate the app's overall rating
export async function saveReviewToFirestore(appId: string, review: AppReview): Promise<void> {
  try {
    const cleanReview = JSON.parse(JSON.stringify(review));
    const reviewRef = doc(db, 'apps', appId, 'reviews', review.id);
    await setDoc(reviewRef, cleanReview);

    // Fetch all reviews to recalculate app rating
    const reviewsCol = collection(db, 'apps', appId, 'reviews');
    const snapshot = await getDocs(reviewsCol);
    let totalRating = 0;
    let count = 0;
    snapshot.forEach((d) => {
      const r = d.data() as AppReview;
      if (typeof r.rating === 'number') {
        totalRating += r.rating;
        count++;
      }
    });

    if (count > 0) {
      const avgRating = Number((totalRating / count).toFixed(1));
      const appRef = doc(db, 'apps', appId);
      await updateDoc(appRef, {
        rating: avgRating,
        ratingsCount: count,
      });
    }
  } catch (error) {
    console.error('Failed to save review in Firestore:', error);
  }
}

// Purge any old seeded mock apps from Firestore (where id starts with 'app-pyi', 'app-shadow', etc.)
export async function purgeAllOldMockAppsFromFirestore(): Promise<number> {
  try {
    const appsCol = collection(db, 'apps');
    const snapshot = await getDocs(appsCol);
    let count = 0;
    for (const d of snapshot.docs) {
      const data = d.data() as APKApp;
      // If it is one of the initial mock apps (not uploaded by user)
      if (!data.customUploaded || data.id.startsWith('app-pyi') || data.id.startsWith('app-shadow') || data.id.startsWith('app-wave') || data.id.startsWith('app-hyper') || data.id.startsWith('app-myan') || data.id.startsWith('app-pixel') || data.id.startsWith('app-doc') || data.id.startsWith('app-sec') || data.id.startsWith('app-speed')) {
        await deleteDoc(d.ref);
        count++;
      }
    }
    return count;
  } catch (error) {
    console.warn('Notice while purging mock apps from Firestore:', error);
    return 0;
  }
}

// Complete wipe of all apps from Firestore
export async function purgeEntireCatalogFromFirestore(): Promise<number> {
  try {
    const appsCol = collection(db, 'apps');
    const snapshot = await getDocs(appsCol);
    let count = 0;
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
      count++;
    }
    return count;
  } catch (error) {
    console.warn('Notice while purging entire catalog from Firestore:', error);
    return 0;
  }
}

// GitHub Configuration Persistence in Firestore
export async function getGitHubConfigFromFirestore(): Promise<{ owner?: string; repo?: string; token?: string } | null> {
  try {
    const docRef = doc(db, 'settings', 'github');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as { owner?: string; repo?: string; token?: string };
    }
  } catch (err) {
    console.warn('Notice loading github config from Firestore:', err);
  }
  return null;
}

export async function saveGitHubConfigToFirestore(cfg: { owner: string; repo: string; token: string }): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'github');
    await setDoc(docRef, {
      owner: cfg.owner,
      repo: cfg.repo,
      token: cfg.token,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('Notice saving github config to Firestore:', err);
    return false;
  }
}
