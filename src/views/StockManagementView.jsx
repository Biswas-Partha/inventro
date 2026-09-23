import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { productsApi } from '../api/apiClient';
import { History, Plus, ArrowUpRight, ArrowDownRight, Search, X, PackagePlus } from 'lucide-react';

export const StockManagementView = () => {
  const { stockMovements, products, refreshProducts, refreshStockMovements, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('10');
  const [reason, setReason] = useState('Inventory Restock');

  const openAdjustModal = () => {
    setSelectedProdId(products[0]?.id ? String(products[0].id) : '');
    setAdjustType('in');
    setAdjustQty('10');
    setReason('Inventory Restock');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const prod = products.find((p) => String(p.id) === String(selectedProdId));
    if (!prod) return;

    try {
      const delta = parseInt(adjustQty, 10) * (adjustType === 'in' ? 1 : -1);
      const newStock = Math.max(0, parseInt(prod.stock || 0, 10) + delta);

      await productsApi.update(prod.id, {
        ...prod,
        stock: newStock,
      });

      addToast(`Stock adjusted for "${prod.name}" (${delta > 0 ? `+${delta}` : delta}). New stock: ${newStock}`, 'success');
      setIsAdjustModalOpen(false);
      refreshProducts();
      refreshStockMovements();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error updating stock', 'danger');
    }
  };

  const filteredMovements = stockMovements.filter((m) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const prodName = m.product?.name || '';
    const prodSku = m.product?.sku || '';
    const note = m.note || m.reason || '';
    return prodName.toLowerCase().includes(q) || prodSku.toLowerCase().includes(q) || note.toLowerCase().includes(q);
  });

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Stock Movements & Audit</h1>
          <p className="view-page-subtitle">Track historical warehouse additions, deductions, and sales</p>
        </div>
        <button onClick={openAdjustModal} className="btn-primary">
          <PackagePlus size={16} />
          <span>Manual Stock Adjustment</span>
        </button>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search movements by product, SKU, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product Details</th>
              <th>Movement Type</th>
              <th>Quantity</th>
              <th>Reason / Reference</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty-row">
                  {stockMovements.length === 0
                    ? 'No stock movements recorded yet.'
                    : 'No movements match your search.'}
                </td>
              </tr>
            ) : (
              filteredMovements.map((move, idx) => {
                const type = (move.type || 'in').toLowerCase();
                const isPositive = type === 'in' || type === 'purchase' || type === 'adjustment_add';

                return (
                  <tr key={move.id || idx}>
                    <td>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {move.created_at ? new Date(move.created_at).toLocaleString() : 'Recent'}
                      </div>
                    </td>
                    <td>
                      <div className="table-item-name">
                        {move.product ? move.product.name : `Product ID #${move.product_id}`}
                      </div>
                      {move.product?.sku && (
                        <div className="table-item-sub">SKU: {move.product.sku}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge-tag ${isPositive ? 'badge-success' : 'badge-danger'}`}>
                        {type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 700,
                          color: isPositive ? '#34d399' : '#f87171',
                        }}
                      >
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{Math.abs(move.quantity || 0)} units</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        {move.note || move.reason || 'Inventory Adjustment'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Stock Adjust Modal */}
      {isAdjustModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAdjustModalOpen(false)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manual Stock Adjustment</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Product *</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="form-control"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Type *</label>
                <div className="transport-method-grid">
                  <button
                    type="button"
                    className={`transport-btn ${adjustType === 'in' ? 'active' : ''}`}
                    onClick={() => setAdjustType('in')}
                  >
                    + Add Stock (Inflow)
                  </button>
                  <button
                    type="button"
                    className={`transport-btn ${adjustType === 'out' ? 'active' : ''}`}
                    onClick={() => setAdjustType('out')}
                  >
                    - Deduct Stock (Outflow)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Units *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Reason / Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory count, damaged goods"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
