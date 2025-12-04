'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image: string;
  quantity: number;
  stock: number;
  stockTracking: boolean;
  allowBackorder: boolean;
  backorderMessage?: string | null;
  // Personal offer fields
  personalOfferId?: string;
  offerType?: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'BUY_X_GET_Y';
  discountPercent?: number;
  discountAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  originalPrice?: number; // Store original price when offer applied
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.productId === item.productId && i.personalOfferId === item.personalOfferId);
      
      if (existingItem) {
        // Update quantity of existing item
        return prevItems.map((i) =>
          i.productId === item.productId && i.personalOfferId === item.personalOfferId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        // Add new item
        return [...prevItems, { ...item, quantity, id: `${item.productId}-${Date.now()}` }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => {
      // Always use the actual price (not originalPrice/comparePrice)
      return total + item.price * item.quantity;
    }, 0);
  };

  const getDiscount = () => {
    return items.reduce((total, item) => {
      if (!item.personalOfferId) return total;

      if (item.offerType === 'PERCENTAGE_DISCOUNT' && item.discountPercent) {
        const discount = (item.originalPrice || item.price) * (item.discountPercent / 100) * item.quantity;
        return total + discount;
      }

      if (item.offerType === 'FIXED_DISCOUNT' && item.discountAmount) {
        return total + item.discountAmount * item.quantity;
      }

      if (item.offerType === 'BUY_X_GET_Y' && item.buyQuantity && item.getQuantity) {
        const sets = Math.floor(item.quantity / item.buyQuantity);
        const freeItems = sets * item.getQuantity;
        return total + (item.originalPrice || item.price) * freeItems;
      }

      return total;
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        getDiscount,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
