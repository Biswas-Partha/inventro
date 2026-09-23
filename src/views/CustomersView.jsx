import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { customersApi, customerAddressesApi } from '../api/apiClient';
import { Plus, Edit2, Trash2, X, Users, MapPin, Phone, Mail, Home } from 'lucide-react';

export const CustomersView = () => {
  const { customers, refreshCustomers, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Customer Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custForm, setCustForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
  });

  // Addresses Modal States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    street: '',
    city: '',
    is_default: false,
  });

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustForm({ name: '', phone: '', email: '', city: '', address: '' });
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (c) => {
    setEditingCustomer(c);
    setCustForm({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      city: c.city || '',
      address: c.address || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleCustomerDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.delete(id);
      addToast('Customer removed', 'info');
      refreshCustomers();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error deleting customer', 'danger');
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, custForm);
        addToast('Customer updated!', 'success');
      } else {
        const created = await customersApi.create(custForm);
        // Also create initial address if provided
        if (custForm.address && created?.id) {
          try {
            await customerAddressesApi.create({
              customer_id: created.id,
              label: 'Primary',
              street: custForm.address,
              city: custForm.city || 'Local',
              is_default: true,
            });
          } catch (e) {
            console.error(e);
          }
        }
        addToast('Customer registered!', 'success');
      }
      setIsCustomerModalOpen(false);
      refreshCustomers();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error saving customer', 'danger');
    }
  };

  // Address Manager
  const openAddressManager = async (cust) => {
    setActiveCustomer(cust);
    setAddrForm({ label: 'Home', street: '', city: cust.city || '', is_default: false });
    try {
      const data = await customerAddressesApi.getByCustomer(cust.id);
      setAddresses(data || []);
      setIsAddressModalOpen(true);
    } catch (err) {
      console.error(err);
      addToast('Could not load addresses', 'danger');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!activeCustomer) return;
    try {
      await customerAddressesApi.create({
        customer_id: activeCustomer.id,
        label: addrForm.label,
        street: addrForm.street,
        city: addrForm.city,
        is_default: addrForm.is_default,
      });
      addToast('Delivery address added!', 'success');
      setAddrForm({ label: 'Home', street: '', city: activeCustomer.city || '', is_default: false });
      const updated = await customerAddressesApi.getByCustomer(activeCustomer.id);
      setAddresses(updated || []);
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to add address', 'danger');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      await customerAddressesApi.delete(addrId);
      addToast('Address deleted', 'info');
      const updated = await customerAddressesApi.getByCustomer(activeCustomer.id);
      setAddresses(updated || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete address', 'danger');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Customer Registry</h1>
          <p className="view-page-subtitle">Named client profiles for POS home deliveries</p>
        </div>
        <button onClick={openAddCustomer} className="btn-primary">
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-search">
          <input
            type="text"
            placeholder="Search customers by name, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>City / Area</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty-row">
                  No customers found.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="table-item-name">{c.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="#94a3b8" />
                      <span>{c.phone}</span>
                    </div>
                  </td>
                  <td>{c.email || <span className="text-muted">—</span>}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{c.city || 'Local'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-action-btns">
                      <button
                        onClick={() => openAddressManager(c)}
                        className="table-btn address"
                        title="Manage Delivery Addresses"
                      >
                        <Home size={14} />
                      </button>
                      <button
                        onClick={() => openEditCustomer(c)}
                        className="table-btn edit"
                        title="Edit Customer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleCustomerDelete(c.id)}
                        className="table-btn delete"
                        title="Delete Customer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCustomerModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={custForm.phone}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">City / Region</label>
                <input
                  type="text"
                  placeholder="Karachi, Lahore, Islamabad..."
                  value={custForm.city}
                  onChange={(e) => setCustForm({ ...custForm, city: e.target.value })}
                  className="form-control"
                />
              </div>

              {!editingCustomer && (
                <div className="form-group">
                  <label className="form-label">Primary Street Address</label>
                  <textarea
                    rows={2}
                    placeholder="House / Street / Apartment details"
                    value={custForm.address}
                    onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                    className="form-control"
                  ></textarea>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCustomer ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Manager Modal */}
      {isAddressModalOpen && activeCustomer && (
        <div className="modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Addresses for {activeCustomer.name}</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {/* Existing Addresses */}
              <div className="address-list-group">
                <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Registered Delivery Addresses:</h4>
                {addresses.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b' }}>No delivery addresses registered yet.</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="address-card-row">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge-tag">{addr.label}</span>
                          {addr.is_default && <span className="default-pill">DEFAULT</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#f1f5f9', marginTop: '4px' }}>
                          {addr.street}, {addr.city}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="table-btn delete"
                        title="Delete Address"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Address Form */}
              <form onSubmit={handleAddAddress} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#6366f1', marginBottom: '10px' }}>+ Add New Address</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Label (e.g. Home, Office)</label>
                    <input
                      type="text"
                      required
                      value={addrForm.label}
                      onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      required
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={addrForm.street}
                    onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isDefaultAddr"
                    checked={addrForm.is_default}
                    onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })}
                  />
                  <label htmlFor="isDefaultAddr" style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                    Set as default delivery address
                  </label>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                  Save Address
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
