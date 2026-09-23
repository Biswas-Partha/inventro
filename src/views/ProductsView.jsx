import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { productsApi } from '../api/apiClient';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  PackagePlus,
  X,
  AlertTriangle,
  Boxes,
} from 'lucide-react';

export const ProductsView = () => {
  const { products, categories, suppliers, refreshProducts, addToast, currency } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(10);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    supplier_id: '',
    purchase_price: '',
    selling_price: '',
    stock: '',
    min_stock: '5',
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      supplier_id: suppliers[0]?.id ? String(suppliers[0].id) : '',
      purchase_price: '',
      selling_price: '',
      stock: '10',
      min_stock: '5',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      category_id: prod.category_id ? String(prod.category_id) : '',
      supplier_id: prod.supplier_id ? String(prod.supplier_id) : '',
      purchase_price: String(prod.purchase_price || ''),
      selling_price: String(prod.selling_price || prod.price || ''),
      stock: String(prod.stock || ''),
      min_stock: String(prod.min_stock || ''),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(prodId);
      addToast('Product deleted successfully', 'info');
      refreshProducts();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to delete product', 'danger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null,
        purchase_price: parseFloat(formData.purchase_price || 0),
        selling_price: parseFloat(formData.selling_price || 0),
        stock: parseInt(formData.stock || 0, 10),
        min_stock: parseInt(formData.min_stock || 0, 10),
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        addToast('Product updated successfully!', 'success');
      } else {
        await productsApi.create(payload);
        addToast('Product created successfully!', 'success');
      }

      setIsModalOpen(false);
      refreshProducts();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error saving product', 'danger');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    try {
      const added = parseInt(restockQty, 10);
      const newStock = parseInt(restockProduct.stock || 0, 10) + added;
      await productsApi.update(restockProduct.id, {
        ...restockProduct,
        stock: newStock,
      });
      addToast(`Restocked ${restockProduct.name} (+${added} units)`, 'success');
      setIsRestockOpen(false);
      refreshProducts();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to restock', 'danger');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="table-view-container">
      {/* Top Action Bar */}
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Products Inventory</h1>
          <p className="view-page-subtitle">Manage catalog items, pricing, and stock limits</p>
        </div>

        <button onClick={openAddModal} className="btn-primary">
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Cost Price</th>
              <th>Sale Price</th>
              <th>Stock Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty-row">
                  No products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const stock = parseInt(p.stock || 0, 10);
                const minStock = parseInt(p.min_stock || 0, 10);
                const isLow = stock <= minStock;
                const costPrice = parseFloat(p.purchase_price || 0);
                const salePrice = parseFloat(p.selling_price || p.price || 0);

                const catObj = categories.find((c) => String(c.id) === String(p.category_id));
                const catName = catObj ? catObj.name : 'Unassigned';

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-item-name">{p.name}</div>
                      <div className="table-item-sub">SKU: {p.sku}</div>
                    </td>
                    <td>
                      <span className="badge-tag">{catName}</span>
                    </td>
                    <td>{currency}{costPrice.toLocaleString()}</td>
                    <td>
                      <strong>{currency}{salePrice.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className={`stock-status-pill ${isLow ? 'low' : 'normal'}`}>
                        {stock} units {isLow ? '(Low)' : ''}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-btns">
                        <button
                          onClick={() => {
                            setRestockProduct(p);
                            setRestockQty(10);
                            setIsRestockOpen(true);
                          }}
                          className="table-btn restock"
                          title="Restock units"
                        >
                          <PackagePlus size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="table-btn edit"
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="table-btn delete"
                          title="Delete Product"
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

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
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
                  <label className="form-label">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- None --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Cost Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sale Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock Alert *</label>
                  <input
                    type="number"
                    required
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="form-control"
                  />
                </div>
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockOpen && restockProduct && (
        <div className="modal-overlay" onClick={() => setIsRestockOpen(false)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Restock Inventory</h3>
              <button onClick={() => setIsRestockOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRestockSubmit} className="modal-body">
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>
                Adding stock units for <strong>{restockProduct.name}</strong>.
                Current stock: <strong>{restockProduct.stock}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">Units to Add *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
