import React from 'react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { Search, ShoppingCart } from 'lucide-react';

export const TopHeader = () => {
  const { searchQuery, setSearchQuery, currency, activeView } = useApp();
  const { cartCount, cartTotal, setIsCartOpen } = useCart();

  const viewTitles = {
    workspace: 'Operations Workspace',
    products: 'Products & Catalog',
    categories: 'Categories',
    suppliers: 'Suppliers Registry',
    customers: 'Customer Registry',
    deliveries: 'Delivery & Logistics',
    stock: 'Stock Movement Audit',
    reports: 'Business Reports',
  };

  return (
    <header className="top-header">
      {/* Current View Title */}
      <div className="header-view-title">
        <h2>{viewTitles[activeView] || 'Dashboard'}</h2>
      </div>

      {/* Global Search Bar */}
      <div className="header-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search products, orders, customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* POS Cart Action */}
      <div className="header-actions">
        <button
          onClick={() => setIsCartOpen(true)}
          className="header-cart-btn"
          title="Open POS Register Cart"
        >
          <ShoppingCart size={18} />
          <span className="cart-badge">{cartCount}</span>
          <span className="cart-total-pill">
            {currency}{cartTotal.toLocaleString()}
          </span>
        </button>
      </div>
    </header>
  );
};
