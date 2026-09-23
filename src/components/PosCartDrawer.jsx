import React from 'react';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

export const PosCartDrawer = ({ onOpenCheckout }) => {
  const {
    cartItems,
    cartTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    updateQty,
    removeFromCart,
    clearCart,
  } = useCart();

  const { currency } = useApp();

  if (!isCartOpen) return null;

  return (
    <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <aside className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <ShoppingCart size={20} color="#6366f1" />
            <h3>POS Register Cart ({cartCount})</h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="drawer-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <ShoppingCart size={40} color="#475569" />
              <p>Your cart is empty.</p>
              <span>Add products from the catalog to ring up a sale.</span>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const price = parseFloat(item.product.selling_price || item.product.price || 0);
                const lineTotal = price * item.quantity;

                return (
                  <div key={item.product.id} className="cart-item-row">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-unit-price">
                        {currency}{price.toLocaleString()} each
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <div className="qty-stepper">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="qty-btn"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="qty-btn"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="cart-item-total">
                        {currency}{lineTotal.toLocaleString()}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="item-delete-btn"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="cart-summary-row">
              <span className="summary-label">Total Amount</span>
              <span className="summary-val">
                {currency}{cartTotal.toLocaleString()}
              </span>
            </div>

            <div className="drawer-btn-row">
              <button onClick={clearCart} className="btn-secondary">
                <Trash2 size={15} />
                <span>Clear</span>
              </button>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                className="btn-primary"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
