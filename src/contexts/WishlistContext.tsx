'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image: string;
  addedAt: string;
  hasActiveOffer?: boolean;
  activeOffer?: {
    id: string;
    offerType: string;
    discountPercent?: number;
    discountAmount?: number;
    buyQuantity?: number;
    getQuantity?: number;
  };
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: Omit<WishlistItem, 'addedAt'>) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  clearOnLogout: () => void;
  itemCount: number;
  syncWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Kullanıcı giriş durumunu kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newIsLoggedIn = !!token;
    
    // Kullanıcı durumu değiştiyse
    if (newIsLoggedIn !== isLoggedIn) {
      setIsLoggedIn(newIsLoggedIn);
      
      if (newIsLoggedIn) {
        // Kullanıcı giriş yapmışsa, veritabanından yükle
        loadFromDatabase();
      } else {
        // Kullanıcı çıkış yapmışsa, localStorage'dan yükle (veya boş bırak)
        loadFromLocalStorage();
      }
    } else if (newIsLoggedIn) {
      // Zaten giriş yapmış, veritabanından yükle
      loadFromDatabase();
    } else {
      // Giriş yapmamış, localStorage'dan yükle
      loadFromLocalStorage();
    }
  }, []);

  const loadFromLocalStorage = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Wishlist parse error:', error);
      }
    }
    setIsLoaded(true);
  };

  const loadFromDatabase = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data);
        
        // Veritabanındaki listeyi localStorage'a da kaydet
        localStorage.setItem('wishlist', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to load wishlist from database:', error);
      // Hata varsa localStorage'dan yükle
      loadFromLocalStorage();
    } finally {
      setIsLoaded(true);
    }
  };

  // LocalStorage'a kaydet (sadece giriş yapmamış kullanıcılar için)
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, isLoaded, isLoggedIn]);

  // Senkronizasyon: localStorage'daki ürünleri veritabanına aktar
  const syncWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const localWishlist = localStorage.getItem('wishlist');
      if (!localWishlist) return;

      const localItems = JSON.parse(localWishlist);
      const productIds = localItems.map((item: WishlistItem) => item.id);

      const res = await fetch('/api/wishlist/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data);
        localStorage.setItem('wishlist', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Sync wishlist error:', error);
    }
  };

  const addToWishlist = async (product: Omit<WishlistItem, 'addedAt'>): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    // Kullanıcı giriş yapmamışsa false döndür
    if (!token) {
      return false;
    }

    const newItem = { ...product, addedAt: new Date().toISOString() };

    // Zaten varsa ekleme
    if (items.some((item) => item.id === product.id)) {
      return true;
    }

    // Kullanıcı giriş yapmışsa veritabanına ekle
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.ok) {
        setItems((prev) => [newItem, ...prev]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Kullanıcı giriş yapmışsa veritabanından sil
      try {
        const res = await fetch(`/api/wishlist?productId=${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setItems((prev) => prev.filter((item) => item.id !== productId));
        }
      } catch (error) {
        console.error('Remove from wishlist error:', error);
      }
    } else {
      // Giriş yapmamışsa sadece localStorage'dan sil
      setItems((prev) => prev.filter((item) => item.id !== productId));
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const clearWishlist = () => {
    setItems([]);
    localStorage.removeItem('wishlist');
  };

  const clearOnLogout = () => {
    // Kullanıcı çıkış yaptığında localStorage'ı temizle
    // Veritabanında kayıtlı kalır, sadece yerel cache temizlenir
    setItems([]);
    localStorage.removeItem('wishlist');
    setIsLoggedIn(false);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        clearOnLogout,
        itemCount: items.length,
        syncWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
