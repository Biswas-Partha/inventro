import React, { createContext, useContext, useState } from 'react';
import { useApp } from './AppContext';

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const { addToast } = useApp();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartTotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product.selling_price || item.product.price || 0);
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    const availableStock = parseInt(product.stock || 0, 10);
    if (availableStock <= 0) {
      addToast(`Cannot add "${product.name}" (Out of stock)`, 'warn');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= availableStock) {
          addToast(`Maximum stock limit (${availableStock}) reached for "${product.name}"`, 'warn');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    addToast(`Added "${product.name}" to POS cart`, 'success');
  };

  const updateQty = (productId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const availableStock = parseInt(item.product.stock || 0, 10);
            const newQty = item.quantity + delta;

            if (newQty > availableStock) {
              addToast(`Cannot exceed stock of ${availableStock}`, 'warn');
              return item;
            }

            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
    addToast('Cart cleared', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
