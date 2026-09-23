// Centralized API Client for Laravel Backend (/api)
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Request failed');
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

// Products API
export const productsApi = {
  getAll: () => request('/products'),
  create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

// Categories API
export const categoriesApi = {
  getAll: () => request('/categories'),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => request('/suppliers'),
  create: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
};

// Customers API
export const customersApi = {
  getAll: () => request('/customers'),
  create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
};

// Customer Addresses API
export const customerAddressesApi = {
  getByCustomer: (customerId) => request(`/customer-addresses?customer_id=${customerId}`),
  create: (data) => request('/customer-addresses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/customer-addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/customer-addresses/${id}`, { method: 'DELETE' }),
};

// Delivery Orders API (Home Delivery & Logistics Feature)
export const deliveryOrdersApi = {
  getAll: (status = 'all') => request(`/delivery-orders${status !== 'all' ? `?status=${status}` : ''}`),
  getById: (id) => request(`/delivery-orders/${id}`),
  create: (data) => request('/delivery-orders', { method: 'POST', body: JSON.stringify(data) }),
  advanceStatus: (id) => request(`/delivery-orders/${id}/advance-status`, { method: 'PATCH' }),
  delete: (id) => request(`/delivery-orders/${id}`, { method: 'DELETE' }),
};

// Stock Movements API
export const stockMovementsApi = {
  getAll: () => request('/stock-movements'),
};
