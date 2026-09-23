import React from 'react';
import { useApp } from '../context/AppContext';
import { Truck, CheckCircle2, Boxes, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const StatCards = () => {
  const { products, deliveryOrders, loading, setActiveView } = useApp();

  const pendingCount = deliveryOrders.filter((d) => d.status === 'pending' || d.status === 'Pending').length;
  const dispatchedCount = deliveryOrders.filter((d) => d.status === 'dispatched' || d.status === 'Dispatched').length;
  const deliveredCount = deliveryOrders.filter((d) => d.status === 'delivered' || d.status === 'Delivered').length;

  const lowStockCount = products.filter((p) => {
    const stock = parseInt(p.stock || 0, 10);
    const minStock = parseInt(p.min_stock || 0, 10);
    return stock <= minStock;
  }).length;

  if (loading && products.length === 0) {
    return (
      <div className="stat-cards-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-metric"></div>
            <div className="skeleton-line skeleton-sub"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stat-cards-grid">
      {/* 1. Active Deliveries */}
      <div
        className="stat-card"
        onClick={() => setActiveView('deliveries')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Active Deliveries</span>
          <div className="stat-icon-badge badge-primary">
            <Truck size={18} />
          </div>
        </div>
        <div className="stat-metric-val">{pendingCount + dispatchedCount}</div>
        <div className="stat-subtext text-warning">
          <span>{pendingCount} Pending Dispatch</span>
          <ArrowUpRight size={13} />
        </div>
      </div>

      {/* 2. Delivered Rate */}
      <div
        className="stat-card"
        onClick={() => setActiveView('deliveries')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Delivered Orders</span>
          <div className="stat-icon-badge badge-success">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="stat-metric-val">{deliveredCount}</div>
        <div className="stat-subtext text-success">
          <span>{dispatchedCount} Currently in Transit</span>
        </div>
      </div>

      {/* 3. Total Products */}
      <div
        className="stat-card"
        onClick={() => setActiveView('products')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Products In Catalog</span>
          <div className="stat-icon-badge badge-info">
            <Boxes size={18} />
          </div>
        </div>
        <div className="stat-metric-val">{products.length}</div>
        <div className="stat-subtext text-muted">
          <span>Total active inventory SKUs</span>
        </div>
      </div>

      {/* 4. Low Stock Alerts */}
      <div
        className="stat-card"
        onClick={() => setActiveView('products')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-card-header">
          <span className="stat-card-title">Low Stock Alerts</span>
          <div className={`stat-icon-badge ${lowStockCount > 0 ? 'badge-danger' : 'badge-success'}`}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="stat-metric-val" style={{ color: lowStockCount > 0 ? '#f87171' : '#34d399' }}>
          {lowStockCount}
        </div>
        <div className="stat-subtext text-danger">
          <span>{lowStockCount > 0 ? 'Requires replenishment' : 'All stocks healthy'}</span>
        </div>
      </div>
    </div>
  );
};
