import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginGate } from './components/AdminLoginGate';
import { APKApp } from './types';
import { 
  subscribeToAppsCatalog, 
  saveAppToFirestore, 
  deleteAppFromFirestore,
  purgeAllOldMockAppsFromFirestore
} from './firebase';
import './index.css';

// Safe LocalStorage wrapper to prevent iframe crashes
const safeStorage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, val: string) => {
    try {
      localStorage.setItem(key, val);
    } catch {
      try {
        sessionStorage.setItem(key, val);
      } catch {
        // memory fallback
      }
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

// Error Boundary to prevent any white screen
class AdminErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Panel caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">P-Store Admin Console</h2>
            <p className="text-xs text-rose-400 font-mono">Notice: {this.state.error}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: '' });
              }}
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
            >
              Recover & Continue Console
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AdminStandaloneApp({ 
  onExit,
  initialApps 
}: { 
  onExit?: () => void;
  initialApps?: APKApp[];
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(safeStorage.get('apexapk_admin_auth'));
  });

  // Verify stored session token with server on mount
  useEffect(() => {
    const token = safeStorage.get('apexapk_admin_auth');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // If fallback token from valid SHA-256 session
    if (token.startsWith('fallback_auth_2a767f054736430c30b1fc2930c9a984555c1555e18aa8e5fdf07fc5d8e81350')) {
      setIsAuthenticated(true);
      return;
    }

    fetch('/api/admin/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Invalid token');
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.valid === false) {
          safeStorage.remove('apexapk_admin_auth');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch((err) => {
        // Network warning - do not immediately kick out logged-in admin
        console.warn('Admin token server check:', err);
      });
  }, []);

  const [apps, setApps] = useState<APKApp[]>(() => {
    if (initialApps && initialApps.length > 0) {
      return initialApps;
    }
    try {
      const stored = safeStorage.get('apexapk_full_catalog');
      if (stored) {
        const parsed: APKApp[] = JSON.parse(stored);
        return parsed.filter((a) => a.customUploaded || (!a.id.startsWith('app-pyi') && !a.id.startsWith('app-shadow')));
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Sync with initialApps if passed from parent
  useEffect(() => {
    if (initialApps && initialApps.length >= 0) {
      setApps(initialApps);
    }
  }, [initialApps]);

  // Subscribe to real-time updates from Firebase only if not provided from parent
  useEffect(() => {
    if (!isAuthenticated || Boolean(initialApps)) return;

    const unsub = subscribeToAppsCatalog((firestoreApps) => {
      const realApps = firestoreApps.filter(
        (a) => a.customUploaded || (!a.id.startsWith('app-pyi') && !a.id.startsWith('app-shadow') && !a.id.startsWith('app-wave') && !a.id.startsWith('app-hyper') && !a.id.startsWith('app-myan') && !a.id.startsWith('app-pixel') && !a.id.startsWith('app-doc') && !a.id.startsWith('app-sec') && !a.id.startsWith('app-speed'))
      );
      setApps(realApps);
      safeStorage.set('apexapk_full_catalog', JSON.stringify(realApps));
    });
    return () => unsub();
  }, [isAuthenticated, initialApps]);

  const handleLogout = () => {
    safeStorage.remove('apexapk_admin_auth');
    setIsAuthenticated(false);
  };

  const handleAppUploaded = async (newApp: APKApp) => {
    const updated = [newApp, ...apps];
    setApps(updated);
    safeStorage.set('apexapk_full_catalog', JSON.stringify(updated));
    await saveAppToFirestore(newApp);
  };

  const handleUpdateApp = async (updatedApp: APKApp) => {
    const updated = apps.map((a) => (a.id === updatedApp.id ? updatedApp : a));
    setApps(updated);
    safeStorage.set('apexapk_full_catalog', JSON.stringify(updated));
    await saveAppToFirestore(updatedApp);
  };

  const handleDeleteApp = async (appId: string) => {
    const updated = apps.filter((a) => a.id !== appId);
    setApps(updated);
    safeStorage.set('apexapk_full_catalog', JSON.stringify(updated));
    await deleteAppFromFirestore(appId);
  };

  if (!isAuthenticated) {
    return (
      <AdminErrorBoundary>
        <AdminLoginGate onAuthenticated={() => setIsAuthenticated(true)} />
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminPanel
        apps={apps}
        onAppUploaded={handleAppUploaded}
        onUpdateApp={handleUpdateApp}
        onDeleteApp={handleDeleteApp}
        onClose={() => {
          if (onExit) {
            onExit();
          } else {
            window.location.href = '/';
          }
        }}
        onLogout={handleLogout}
        language="my"
      />
    </AdminErrorBoundary>
  );
}

// Auto mount ONLY if inside standalone admin.html (#admin-root)
const adminRootEl = document.getElementById('admin-root');
if (adminRootEl) {
  createRoot(adminRootEl).render(<AdminStandaloneApp />);
}
