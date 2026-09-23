import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { suppliersApi } from '../api/apiClient';
import { Plus, Edit2, Trash2, X, Truck, Mail, Phone, MapPin } from 'lucide-react';

export const SuppliersView = () => {
  const { suppliers, refreshSuppliers, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  const openAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const openEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name || '',
      contact_person: sup.contact_person || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier record?')) return;
    try {
      await suppliersApi.delete(id);
      addToast('Supplier deleted', 'info');
      refreshSuppliers();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error deleting supplier', 'danger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData);
        addToast('Supplier updated!', 'success');
      } else {
        await suppliersApi.create(formData);
        addToast('Supplier created!', 'success');
      }
      setIsModalOpen(false);
      refreshSuppliers();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error saving supplier', 'danger');
    }
  };

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Suppliers Registry</h1>
          <p className="view-page-subtitle">Track vendors and wholesale procurement partners</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Contact Person</th>
              <th>Contact Info</th>
              <th>Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty-row">
                  No suppliers registered yet.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="table-item-name">{s.name}</div>
                  </td>
                  <td>{s.contact_person || <span className="text-muted">—</span>}</td>
                  <td>
                    <div style={{ fontSize: '12px' }}>
                      {s.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="#94a3b8" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Mail size={12} color="#94a3b8" />
                          <span>{s.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.address || '—'}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-action-btns">
                      <button
                        onClick={() => openEdit(s)}
                        className="table-btn edit"
                        title="Edit Supplier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="table-btn delete"
                        title="Delete Supplier"
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Office / Warehouse Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-control"
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
