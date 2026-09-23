import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { Plus, Search, Tag, AlertTriangle, Layers } from 'lucide-react';

export const ProductCatalog = () => {
  const { products, categories, searchQuery, currency } = useApp();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      String(p.category_id) === String(selectedCategory);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="catalog-container">
      {/* Catalog Header */}
      <div className="catalog-header">
        <div>
          <h2 className="section-title">Catalog & Inventory</h2>
          <p className="section-subtitle">
            One-click addition to point-of-sale register
          </p>
        </div>

        {/* Category Pills */}
        <div className="category-pills-bar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`pill-btn ${selectedCategory === String(cat.id) ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Product Cards */}
      {filteredProducts.length === 0 ? (
        <div className="empty-catalog-state">
          <Layers size={36} color="#64748b" />
          <p>No products match the selected criteria.</p>
        </div>
      ) : (
        <div className="product-cards-grid">
          {filteredProducts.map((prod) => {
            const stock = parseInt(prod.stock || 0, 10);
            const minStock = parseInt(prod.min_stock || 0, 10);
            const isLow = stock <= minStock;
            const isOutOfStock = stock <= 0;
            const price = parseFloat(prod.selling_price || prod.price || 0);

            // Lookup category name
            const categoryObj = categories.find((c) => String(c.id) === String(prod.category_id));
            const categoryName = categoryObj ? categoryObj.name : 'General';

            return (
              <div key={prod.id} className="product-card">
                <div>
                  <div className="product-card-top">
                    <span className="product-cat-tag">{categoryName}</span>
                    {isLow && !isOutOfStock && (
                      <span className="stock-alert-tag">Low Stock</span>
                    )}
                    {isOutOfStock && (
                      <span className="stock-out-tag">Out of Stock</span>
                    )}
                  </div>

                  <h3 className="product-title">{prod.name}</h3>
                  <div className="product-sku">SKU: {prod.sku}</div>
                </div>

                <div className="product-card-bottom">
                  <div className="product-price-row">
                    <span className="product-price">
                      {currency}{price.toLocaleString()}
                    </span>
                    <span className={`product-stock-pill ${isLow ? 'low' : ''}`}>
                      {stock} in stock
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    disabled={isOutOfStock}
                    className="add-to-cart-btn"
                  >
                    <Plus size={15} />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to POS'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
