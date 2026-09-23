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
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Package,
} from 'lucide-react';

export const DeliveryStream = () => {
  const { deliveryOrders, refreshDeliveries, addToast, searchQuery, currency } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [advancingId, setAdvancingId] = useState(null);

  const pendingCount = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'pending').length;
  const dispatchedCount = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'dispatched').length;
  const deliveredCount = deliveryOrders.filter((d) => (d.status || '').toLowerCase() === 'delivered').length;

  const filteredOrders = deliveryOrders.filter((order) => {
    const st = (order.status || '').toLowerCase();
    if (statusFilter !== 'all' && st !== statusFilter.toLowerCase()) {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
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
      addToast('Delivery order advanced to next status stage!', 'success');
      refreshDeliveries();
    } catch (err) {
      console.error('Error advancing status:', err);
      addToast(err.message || 'Could not advance status', 'danger');
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="delivery-stream-container">
      {/* Stream Header */}
      <div className="stream-header">
        <div>
          <h2 className="section-title">Logistics & Home Deliveries</h2>
          <p className="section-subtitle">
            Lifecycle tracking: Pending &rarr; Dispatched &rarr; Delivered
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="stream-filter-tabs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`stream-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
          >
            All ({deliveryOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`stream-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          >
            Pending ({pendingCount})
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
            Delivered ({deliveredCount})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="stream-orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-stream-state">
            <Truck size={36} color="#64748b" />
            <p>No delivery orders found under this filter.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const st = (order.status || 'pending').toLowerCase();
            const isPending = st === 'pending';
            const isDispatched = st === 'dispatched';
            const isDelivered = st === 'delivered';

            const customerName = order.customer?.name || 'Customer';
            const customerPhone = order.customer?.phone || 'No phone';
            const address = order.delivery_address
              ? `${order.delivery_address.street}, ${order.delivery_address.city}`
              : 'Delivery Address';

            const isCourier = order.transport_method === 'courier';

            return (
              <div key={order.id} className="delivery-order-card">
                {/* Card Top */}
                <div className="order-card-top">
                  <div className="order-id-group">
                    <span className="order-number">DO-#{order.id}</span>
                    <span className={`status-pill ${st}`}>
                      {st.toUpperCase()}
                    </span>
                  </div>
                  <span className="order-date">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                {/* Customer & Address Details */}
                <div className="order-customer-box">
                  <div className="order-customer-name">
                    <User size={14} color="#94a3b8" />
                    <strong>{customerName}</strong> &bull; {customerPhone}
                  </div>
                  <div className="order-customer-addr">
                    <MapPin size={13} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{address}</span>
                  </div>
                </div>

                {/* Transport Method & Tracking Details */}
                <div className="transport-badge-row">
                  <div className="transport-method-pill">
                    <Truck size={13} />
                    <span>{isCourier ? 'Courier' : 'Own Rider'}</span>
                  </div>

                  {isCourier && order.tracking_number && (
                    <div className="tracking-badge">
                      <span>{order.courier_name || 'Carrier'}:</span>
                      <strong>{order.tracking_number}</strong>
                    </div>
                  )}
                </div>

                {/* Items Summary */}
                {order.items && order.items.length > 0 && (
                  <div className="order-items-snippet">
                    <Package size={12} color="#64748b" />
                    <span>
                      {order.items.map((it) => `${it.quantity}x ${it.description || it.product_name}`).join(', ')}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="order-notes-box">
                    <em>"{order.notes}"</em>
                  </div>
                )}

                {/* Card Footer / Action */}
                <div className="order-card-footer">
                  <div className="order-action-slot">
                    {isPending && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id)}
                        disabled={advancingId === order.id}
                        className="advance-btn dispatch"
                      >
                        <span>{advancingId === order.id ? 'Updating...' : 'Mark Dispatched'}</span>
                        <ChevronRight size={14} />
                      </button>
                    )}

                    {isDispatched && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id)}
                        disabled={advancingId === order.id}
                        className="advance-btn deliver"
                      >
                        <span>{advancingId === order.id ? 'Updating...' : 'Confirm Delivery'}</span>
                        <CheckCircle2 size={14} />
                      </button>
                    )}

                    {isDelivered && (
                      <div className="delivered-badge">
                        <CheckCircle2 size={14} />
                        <span>Completed & Confirmed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
