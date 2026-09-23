import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, CheckCircle2, X } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, saleDetails }) => {
  const { currency } = useApp();

  if (!isOpen || !saleDetails) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <CheckCircle2 size={20} color="#10b981" />
            <h3>Transaction Receipt</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="receipt-content" id="printable-receipt">
          <div className="receipt-header-banner">
            <h2>Inventro Store</h2>
            <p>Smart Inventory & Home Delivery Logistics</p>
            <div className="receipt-meta">
              <span>Receipt #: <strong>{saleDetails.receiptNo}</strong></span>
              <span>Date: {saleDetails.date}</span>
            </div>
            <div className="receipt-meta">
              <span>Payment: <strong>{saleDetails.paymentMethod.toUpperCase()}</strong></span>
              {saleDetails.isHomeDelivery && (
                <span className="delivery-flag">★ HOME DELIVERY</span>
              )}
            </div>
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {saleDetails.items.map((it, idx) => {
                const price = parseFloat(it.product.selling_price || it.product.price || 0);
                return (
                  <tr key={idx}>
                    <td>{it.product.name}</td>
                    <td>{it.quantity}</td>
                    <td>{currency}{price.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {currency}{(price * it.quantity).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="receipt-totals-section">
            <div className="totals-row grand-total">
              <span>Grand Total:</span>
              <span>{currency}{saleDetails.total.toLocaleString()}</span>
            </div>
          </div>

          {saleDetails.isHomeDelivery && saleDetails.deliveryOrder && (
            <div className="receipt-delivery-info">
              <h4>Delivery Information</h4>
              <p>Method: {saleDetails.deliveryOrder.transport_method === 'courier' ? `Courier (${saleDetails.deliveryOrder.courier_name} - ${saleDetails.deliveryOrder.tracking_number})` : 'Own Rider'}</p>
              {saleDetails.deliveryOrder.notes && (
                <p>Notes: {saleDetails.deliveryOrder.notes}</p>
              )}
            </div>
          )}

          <div className="receipt-footer">
            <p>Thank you for your business!</p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
