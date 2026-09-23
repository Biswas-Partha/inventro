import React from 'react';
import { StatCards } from '../components/StatCards';
import { ProductCatalog } from '../components/ProductCatalog';
import { DeliveryStream } from '../components/DeliveryStream';

export const WorkspaceView = () => {
  return (
    <div className="workspace-view">
      {/* 4 Top KPI Cards */}
      <StatCards />

      {/* Dual Modular Stream */}
      <div className="workspace-stream-grid">
        <ProductCatalog />
        <DeliveryStream />
      </div>
    </div>
  );
};
