import React, { useState, useEffect } from 'react';
import { productsApi } from '../api/products.js';

const Products = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, [storeId]);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll(storeId);
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityUpdate = async (id, quantity) => {
    await productsApi.update(id, { quantity });
    loadProducts();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_id.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'low') return matchesSearch && p.quantity <= p.reorder_point && p.quantity > 0;
    if (filter === 'out') return matchesSearch && p.quantity === 0;
    return matchesSearch;
  });

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">Manage stock levels and reorder points</p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center gap-4" style={{ marginBottom: 20 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
            <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</div>
            <div className={`tab ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter('low')}>Low Stock</div>
            <div className={`tab ${filter === 'out' ? 'active' : ''}`} onClick={() => setFilter('out')}>Out of Stock</div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div>No products found</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Variant ID</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Reorder Point</th>
                <th>Reorder Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td>{p.product_id}</td>
                  <td>{p.variant_id || '-'}</td>
                  <td>{p.location_id || '-'}</td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={p.quantity}
                      onChange={e => handleQuantityUpdate(p.id, parseInt(e.target.value))}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td>{p.reorder_point}</td>
                  <td>{p.reorder_quantity}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Products;