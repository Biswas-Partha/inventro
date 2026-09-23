import React from 'react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import {
  Boxes,
  LayoutDashboard,
  Box,
  Tags,
  Truck,
  Users,
  Send,
  History,
  BarChart3,
  ShoppingCart,
  Sun,
  Moon,
  Search,
  RefreshCw,
} from 'lucide-react';

export const Navbar = () => {
  const {
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    refreshAll,
    loading,
    currency,
  } = useApp();

  const { cartCount, cartTotal, setIsCartOpen } = useCart();

  const navItems = [
    { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Box },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'deliveries', label: 'Deliveries', icon: Send },
    { id: 'stock', label: 'Stock Audit', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <header className="navbar-header">
      <div className="navbar-top">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => setActiveView('workspace')}>
          <div className="brand-icon">
            <Boxes size={22} color="#fff" />
          </div>
          <div>
            <span className="brand-name">Inventro</span>
            <span className="brand-badge">PORT 8001</span>
          </div>
        </div>

        {/* Global Search */}
        <div className="navbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Quick search products, orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right Tools */}
        <div className="navbar-actions">
          {/* Refresh Data */}
          <button
            onClick={refreshAll}
            disabled={loading}
            className="action-btn"
            title="Refresh Server Data"
          >
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
          </button>

          {/* Theme Switcher */}
          <button onClick={toggleTheme} className="action-btn" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* POS Cart Pill */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="navbar-cart-btn"
            title="Open POS Cart"
          >
            <ShoppingCart size={18} />
            <span className="cart-badge">{cartCount}</span>
            <span className="cart-total-pill">
              {currency}{cartTotal.toLocaleString()}
            </span>
          </button>
        </div>
      </div>

      {/* Nav Tab Bar */}
      <nav className="navbar-subnav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`nav-tab-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
