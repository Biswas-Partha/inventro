import React from 'react';
import { useApp } from '../context/AppContext';
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
  Sun,
  Moon,
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeView,
    setActiveView,
    theme,
    toggleTheme,
  } = useApp();

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
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => setActiveView('workspace')}>
        <div className="brand-icon">
          <Boxes size={22} color="#fff" />
        </div>
        <div className="brand-text">
          <span className="brand-name">Inventro</span>
          <span className="brand-subtitle">Inventory & Logistics</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-title">MAIN MENU</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-item-icon" />
              <span className="nav-item-label">{item.label}</span>
              {isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button
          onClick={toggleTheme}
          className="sidebar-theme-toggle"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
};
