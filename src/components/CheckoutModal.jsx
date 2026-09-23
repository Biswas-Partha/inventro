import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import {
  customerAddressesApi,
  deliveryOrdersApi,
  productsApi,
} from '../api/apiClient';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Truck,
  User,
  MapPin,
  CheckCircle,
} from 'lucide-react';

export const CheckoutModal = ({ isOpen, onClose, onSaleCompleted }) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { customers, currency, addToast, refreshDeliveries, refreshProducts } = useApp();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [transportMethod, setTransportMethod] = useState('own_rider');
  const [courierName, setCourierName] = useState('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Set default customer
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(String(customers[0].id));
    }
  }, [customers, selectedCustomerId]);

  // Fetch addresses when customer changes
  useEffect(() => {
    if (selectedCustomerId && isHomeDelivery) {
      customerAddressesApi
        .getByCustomer(selectedCustomerId)
        .then((addrs) => {
          setCustomerAddresses(addrs || []);
          if (addrs && addrs.length > 0) {
            const def = addrs.find((a) => a.is_default) || addrs[0];
            setSelectedAddressId(String(def.id));
          } else {
            setSelectedAddressId('');
          }
        })
        .catch((err) => {
          console.error('Error fetching addresses:', err);
        });
    }
  }, [selectedCustomerId, isHomeDelivery]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setSubmitting(true);

    try {
      let createdDeliveryOrder = null;

      // 1. If Home Delivery is selected, create Delivery Order via POST /api/delivery-orders
      if (isHomeDelivery) {
        if (!selectedCustomerId) {
          addToast('Please select a customer for home delivery', 'warn');
          setSubmitting(false);
          return;
        }

        if (!selectedAddressId) {
          addToast('Selected customer has no registered delivery address', 'warn');
          setSubmitting(false);
          return;
        }

        if (transportMethod === 'courier' && (!courierName || !trackingNumber)) {
          addToast('Courier Name and Tracking Number are required for courier shipments', 'warn');
          setSubmitting(false);
          return;
        }

        const deliveryPayload = {
          customer_id: parseInt(selectedCustomerId, 10),
          delivery_address_id: parseInt(selectedAddressId, 10),
          transport_method: transportMethod,
          courier_name: transportMethod === 'courier' ? courierName : null,
          tracking_number: transportMethod === 'courier' ? trackingNumber : null,
          notes: notes || null,
          items: cartItems.map((item) => ({
            description: `${item.product.name} (SKU: ${item.product.sku})`,
            quantity: item.quantity,
          })),
        };

        createdDeliveryOrder = await deliveryOrdersApi.create(deliveryPayload);
        addToast(`Delivery Order created successfully!`, 'success');
        refreshDeliveries();
      }

      // 2. Update stock for purchased products in backend
      for (const item of cartItems) {
        const newStock = Math.max(0, parseInt(item.product.stock || 0, 10) - item.quantity);
        try {
          await productsApi.update(item.product.id, {
            ...item.product,
            stock: newStock,
          });
        } catch (err) {
          console.error(`Error updating stock for product ${item.product.id}:`, err);
        }
      }

      refreshProducts();

      // Trigger receipt modal
      const saleDetails = {
        receiptNo: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleString(),
        paymentMethod,
        items: [...cartItems],
        total: cartTotal,
        isHomeDelivery,
        deliveryOrder: createdDeliveryOrder,
      };

      clearCart();
      onClose();
      onSaleCompleted(saleDetails);
      addToast('Sale finalized successfully!', 'success');
    } catch (err) {
      console.error('Checkout error:', err);
      addToast(err.message || 'Error completing sale', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <CheckCircle size={20} color="#10b981" />
            <h3>Complete POS Checkout</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Order Summary Pill */}
          <div className="checkout-summary-box">
            <div>
              <span className="summary-label">Items Count:</span>{' '}
              <strong>{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
            </div>
            <div>
              <span className="summary-label">Total Due:</span>{' '}
              <span className="checkout-total">
                {currency}{cartTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="payment-options-grid">
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote size={18} />
                <span>Cash</span>
              </button>
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={18} />
                <span>Card</span>
              </button>
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === 'online' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('online')}
              >
                <Smartphone size={18} />
                <span>Online / Transfer</span>
              </button>
            </div>
          </div>

          {/* Home Delivery Logistics Toggle */}
          <div className="home-delivery-toggle-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isHomeDelivery}
                onChange={(e) => setIsHomeDelivery(e.target.checked)}
              />
              <span className="checkbox-title">
                <Truck size={17} color="#6366f1" />
                Home Delivery Required (Create Delivery Order)
              </span>
            </label>

            {isHomeDelivery && (
              <div className="home-delivery-fields">
                {/* Select Customer */}
                <div className="form-group">
                  <label className="form-label">Select Registered Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - {c.city || 'Local'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Address */}
                {selectedCustomerId && (
                  <div className="form-group">
                    <label className="form-label">Select Delivery Address</label>
                    {customerAddresses.length === 0 ? (
                      <div className="warning-text">
                        No address found for this customer. Please add an address in Customers view.
                      </div>
                    ) : (
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="form-control"
                        required
                      >
                        {customerAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            [{addr.label}] {addr.street}, {addr.city} {addr.is_default ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Transport Method */}
                <div className="form-group">
                  <label className="form-label">Transport Method</label>
                  <div className="transport-method-grid">
                    <button
                      type="button"
                      className={`transport-btn ${transportMethod === 'own_rider' ? 'active' : ''}`}
                      onClick={() => setTransportMethod('own_rider')}
                    >
                      Own Rider (In-House)
                    </button>
                    <button
                      type="button"
                      className={`transport-btn ${transportMethod === 'courier' ? 'active' : ''}`}
                      onClick={() => setTransportMethod('courier')}
                    >
                      Third-Party Courier
                    </button>
                  </div>
                </div>

                {/* Courier Details */}
                {transportMethod === 'courier' && (
                  <div className="courier-fields-grid">
                    <div className="form-group">
                      <label className="form-label">Courier Name</label>
                      <input
                        type="text"
                        placeholder="e.g. TCS, Leopards, DHL"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tracking Number</label>
                      <input
                        type="text"
                        placeholder="e.g. TCS-998241"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Delivery Instructions / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Call before delivery, fragile package"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-control"
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : `Confirm Sale (${currency}${cartTotal.toLocaleString()})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
