import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  productsApi,
  categoriesApi,
  suppliersApi,
  customersApi,
  deliveryOrdersApi,
  stockMovementsApi,
} from '../api/apiClient';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  // Global Entities
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  // UI State
  const [activeView, setActiveView] = useState('workspace'); // 'workspace', 'products', 'categories', 'suppliers', 'customers', 'deliveries', 'stock', 'reports'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('inventro_theme') || 'dark');
  const [currency, setCurrency] = useState(() => localStorage.getItem('inventro_currency') || 'PKR ');
  const [toasts, setToasts] = useState([]);

  // Toast notifications helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle theme mode
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('inventro_theme', next);
    if (next === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Initial Data Fetch
  const refreshAll = async () => {
    setLoading(true);
    try {
      const [prod, cat, sup, cust, deliv, moves] = await Promise.allSettled([
        productsApi.getAll(),
        categoriesApi.getAll(),
        suppliersApi.getAll(),
        customersApi.getAll(),
        deliveryOrdersApi.getAll(),
        stockMovementsApi.getAll(),
      ]);

      if (prod.status === 'fulfilled') setProducts(prod.value || []);
      if (cat.status === 'fulfilled') setCategories(cat.value || []);
      if (sup.status === 'fulfilled') setSuppliers(sup.value || []);
      if (cust.status === 'fulfilled') setCustomers(cust.value || []);
      if (deliv.status === 'fulfilled') setDeliveryOrders(deliv.value || []);
      if (moves.status === 'fulfilled') setStockMovements(moves.value || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      addToast('Could not load data from server. Please verify backend is running on port 8001.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshDeliveries = async () => {
    try {
      const data = await deliveryOrdersApi.getAll();
      setDeliveryOrders(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshStockMovements = async () => {
    try {
      const data = await stockMovementsApi.getAll();
      setStockMovements(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        categories,
        suppliers,
        customers,
        deliveryOrders,
        setDeliveryOrders,
        stockMovements,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        loading,
        theme,
        toggleTheme,
        currency,
        setCurrency,
        toasts,
        addToast,
        removeToast,
        refreshAll,
        refreshProducts,
        refreshDeliveries,
        refreshCustomers,
        refreshCategories,
        refreshSuppliers,
        refreshStockMovements,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
