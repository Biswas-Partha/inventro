import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { PosCartDrawer } from './components/PosCartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';

// Views
import { WorkspaceView } from './views/WorkspaceView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { SuppliersView } from './views/SuppliersView';
import { CustomersView } from './views/CustomersView';
import { DeliveriesView } from './views/DeliveriesView';
import { StockManagementView } from './views/StockManagementView';
import { ReportsView } from './views/ReportsView';

export const App = () => {
  const { activeView } = useApp();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleSaleCompleted = (details) => {
    setSaleDetails(details);
    setIsReceiptOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Viewport */}
      <main className="main-viewport">
        {activeView === 'workspace' && <WorkspaceView />}
        {activeView === 'products' && <ProductsView />}
        {activeView === 'categories' && <CategoriesView />}
        {activeView === 'suppliers' && <SuppliersView />}
        {activeView === 'customers' && <CustomersView />}
        {activeView === 'deliveries' && <DeliveriesView />}
        {activeView === 'stock' && <StockManagementView />}
        {activeView === 'reports' && <ReportsView />}
      </main>

      {/* POS Cart Drawer */}
      <PosCartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      {/* POS Checkout Modal with Home Delivery Toggle */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleCompleted={handleSaleCompleted}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleDetails={saleDetails}
      />

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default App;
