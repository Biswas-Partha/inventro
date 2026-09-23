import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { categoriesApi } from '../api/apiClient';
import { Plus, Edit2, Trash2, X, Tags } from 'lucide-react';

export const CategoriesView = () => {
  const { categories, products, refreshCategories, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const openAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      addToast('Category deleted successfully', 'info');
      refreshCategories();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error deleting category', 'danger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, { name, description });
        addToast('Category updated!', 'success');
      } else {
        await categoriesApi.create({ name, description });
        addToast('Category created!', 'success');
      }
      setIsModalOpen(false);
      refreshCategories();
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error saving category', 'danger');
    }
  };

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <div>
          <h1 className="view-page-title">Categories</h1>
          <p className="view-page-subtitle">Organize products into functional departments</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Assigned Products</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="table-empty-row">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const count = products.filter((p) => String(p.category_id) === String(c.id)).length;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="table-item-name">{c.name}</div>
                    </td>
                    <td>{c.description || <span className="text-muted">No description</span>}</td>
                    <td>
                      <span className="badge-tag">{count} items</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-btns">
                        <button
                          onClick={() => openEdit(c)}
                          className="table-btn edit"
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="table-btn delete"
                          title="Delete Category"
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
