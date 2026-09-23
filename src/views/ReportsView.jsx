import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, DollarSign, Package, Truck, Printer } from 'lucide-react';

export const ReportsView = () => {
  const { products, deliveryOrders, currency } = useApp();

  // Financial calculations
  const totalRetailValuation = products.reduce((sum, p) => {
    const price = parseFloat(p.selling_price || p.price || 0);
    const stock = parseInt(p.stock || 0, 10);
    return sum + price * stock;
  }, 0);

  const totalCostValuation = products.reduce((sum, p) => {
    const cost = parseFloat(p.purchase_price || 0);
    const stock = parseInt(p.stock || 0, 10);
    return sum + cost * stock;
  }, 0);

  const potentialProfit = totalRetailValuation - totalCostValuation;

  const totalUnitsInStock = products.reduce((sum, p) => sum + parseInt(p.stock || 0, 10), 0);

  const completedOrders = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'delivered');
  const totalDeliveryRevenue = deliveryOrders.reduce((sum, d) => {
    if (d.items) {
      // Estimate or calculate
      return sum + (d.total_amount || 0);
    }
    return sum;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Reports & Business Analytics</h1>
          <p className="view-page-subtitle">Inventory valuation, margin health, and fulfillment performance</p>
        </div>
        <button onClick={handlePrint} className="btn-primary">
          <Printer size={16} />
          <span>Print Report</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="stat-cards-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Inventory Retail Value</span>
            <div className="stat-icon-badge badge-primary">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-metric-val">
            {currency}{totalRetailValuation.toLocaleString()}
          </div>
          <div className="stat-subtext text-muted">
            <span>Across {totalUnitsInStock.toLocaleString()} total units in stock</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Inventory Cost Basis</span>
            <div className="stat-icon-badge badge-info">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-metric-val">
            {currency}{totalCostValuation.toLocaleString()}
          </div>
          <div className="stat-subtext text-muted">
            <span>Procurement capital locked in stock</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Projected Gross Margin</span>
            <div className="stat-icon-badge badge-success">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-metric-val" style={{ color: '#34d399' }}>
            {currency}{potentialProfit.toLocaleString()}
          </div>
          <div className="stat-subtext text-success">
            <span>
              {totalRetailValuation > 0
                ? `${((potentialProfit / totalRetailValuation) * 100).toFixed(1)}% estimated markup`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Delivered Fulfillment</span>
            <div className="stat-icon-badge badge-success">
              <Truck size={18} />
            </div>
          </div>
          <div className="stat-metric-val">{completedOrders.length}</div>
          <div className="stat-subtext text-muted">
            <span>Successful customer deliveries</span>
          </div>
        </div>
      </div>

      {/* Stock Summary Table */}
      <div className="table-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Valuation Breakdown by Product</h3>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th>Current Stock</th>
              <th>Unit Cost</th>
              <th>Unit Retail</th>
              <th>Total Valuation</th>
              <th style={{ textAlign: 'right' }}>Est. Margin</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = parseInt(p.stock || 0, 10);
              const cost = parseFloat(p.purchase_price || 0);
              const retail = parseFloat(p.selling_price || p.price || 0);
              const totalVal = stock * retail;
              const margin = retail > 0 ? (((retail - cost) / retail) * 100).toFixed(0) : 0;

              return (
                <tr key={p.id}>
                  <td>
                    <div className="table-item-name">{p.name}</div>
                    <div className="table-item-sub">{p.sku}</div>
                  </td>
                  <td><strong>{stock}</strong></td>
                  <td>{currency}{cost.toLocaleString()}</td>
                  <td>{currency}{retail.toLocaleString()}</td>
                  <td><strong>{currency}{totalVal.toLocaleString()}</strong></td>
                  <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 700 }}>
                    {margin}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
