import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { deliveryOrdersApi } from '../api/apiClient';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Trash2,
  ChevronRight,
  Package,
  Search,
} from 'lucide-react';

export const DeliveriesView = () => {
  const { deliveryOrders, refreshDeliveries, addToast, currency } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [advancingId, setAdvancingId] = useState(null);

  const pendingCount = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'pending').length;
  const dispatchedCount = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'dispatched').length;
  const deliveredCount = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'delivered').length;

  const filteredOrders = deliveryOrders.filter((order) => {
    const st = (order.status || '').toLowerCase();
    if (statusFilter !== 'all' && st !== statusFilter.toLowerCase()) {
      return false;
    }

    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const matchCustomer = order.customer?.name?.toLowerCase().includes(q);
      const matchPhone = order.customer?.phone?.toLowerCase().includes(q);
      const matchTracking = order.tracking_number?.toLowerCase().includes(q);
      const matchOrderNo = String(order.id).includes(q);
      return matchCustomer || matchPhone || matchTracking || matchOrderNo;
    }

    return true;
  });

  const handleAdvanceStatus = async (orderId) => {
    setAdvancingId(orderId);
    try {
      await deliveryOrdersApi.advanceStatus(orderId);
      addToast('Delivery order advanced!', 'success');
      refreshDeliveries();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to advance status', 'danger');
    } finally {
      setAdvancingId(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Delete this delivery order record?')) return;
    try {
      await deliveryOrdersApi.delete(orderId);
      addToast('Delivery order deleted', 'info');
      refreshDeliveries();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error deleting order', 'danger');
    }
  };

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Delivery & Logistics Pipeline</h1>
          <p className="view-page-subtitle">Coordinate home shipments, in-house riders, and courier tracking</p>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="stream-filter-tabs" style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setStatusFilter('all')}
          className={`stream-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
        >
          All Orders ({deliveryOrders.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`stream-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
        >
          Pending Dispatch ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter('dispatched')}
          className={`stream-tab-btn ${statusFilter === 'dispatched' ? 'active' : ''}`}
        >
          In Transit ({dispatchedCount})
        </button>
        <button
          onClick={() => setStatusFilter('delivered')}
          className={`stream-tab-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
        >
          Delivered & Confirmed ({deliveredCount})
        </button>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by order #, customer, tracking number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer Info</th>
              <th>Destination Address</th>
              <th>Transport Method</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty-row">
                  No delivery orders match this filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const st = (order.status || 'pending').toLowerCase();
                const isPending = st === 'pending';
                const isDispatched = st === 'dispatched';
                const isDelivered = st === 'delivered';

                const customerName = order.customer?.name || 'Walk-in Client';
                const customerPhone = order.customer?.phone || '—';
                const address = order.delivery_address
                  ? `${order.delivery_address.street}, ${order.delivery_address.city}`
                  : '—';

                const isCourier = order.transport_method === 'courier';

                return (
                  <tr key={order.id}>
                    <td>
                      <div className="table-item-name">DO-#{order.id}</div>
                      <div className="table-item-sub">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{customerName}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{customerPhone}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', maxWidth: '220px' }}>{address}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="badge-tag">
                          {isCourier ? 'Courier' : 'Own Rider'}
                        </span>
                        {isCourier && order.tracking_number && (
                          <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {order.courier_name}: {order.tracking_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${st}`}>
                        {st.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-btns">
                        {isPending && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id)}
                            disabled={advancingId === order.id}
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Mark Dispatched
                          </button>
                        )}
                        {isDispatched && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id)}
                            disabled={advancingId === order.id}
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px', background: '#059669' }}
                          >
                            Confirm Delivery
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="table-btn delete"
                          title="Delete Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
