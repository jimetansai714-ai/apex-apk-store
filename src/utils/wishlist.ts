import { useState, useEffect } from 'react';
import { APKApp } from '../types';

const WISHLIST_KEY = 'pstore_wishlist_ids';

export function getStoredWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWishlistIds(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('pstore_wishlist_updated'));
  } catch {
    // ignore
  }
}

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getStoredWishlistIds());

  useEffect(() => {
    const syncWishlist = () => {
      setWishlistIds(getStoredWishlistIds());
    };

    window.addEventListener('pstore_wishlist_updated', syncWishlist);
    window.addEventListener('storage', syncWishlist);
    return () => {
      window.removeEventListener('pstore_wishlist_updated', syncWishlist);
      window.removeEventListener('storage', syncWishlist);
    };
  }, []);

  const toggleWishlist = (appId: string) => {
    setWishlistIds((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      saveWishlistIds(next);
      return next;
    });
  };

  const isWishlisted = (appId: string) => wishlistIds.includes(appId);

  const clearWishlist = () => {
    saveWishlistIds([]);
    setWishlistIds([]);
  };

  return {
    wishlistIds,
    wishlistCount: wishlistIds.length,
    toggleWishlist,
    isWishlisted,
    clearWishlist,
  };
}
