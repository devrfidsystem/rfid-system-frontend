import type { EntityKey } from '@/types/entities';
import type { Component } from 'vue';
import {
  FileBarChart2,
  ClipboardCheck,
  ArrowUpRight,
  Repeat,
  Activity,
  Clock4,
  BarChart4
} from 'lucide-vue-next';

export type ReportKey =
  | 'inbound'
  | 'outbound'
  | 'stock-opname'
  | 'relocation'
  | 'transfer'
  | 'return'
  | 'current-stock'
  | 'stock-period';

export interface ReportConfig {
  entity: EntityKey;
  title: string;
  description: string;
  columns: { key: string; label: string }[];
  partnerLabel?: string;
  partnerDataset?: EntityKey;
  partnerKey?: string;
  warehouseKey?: string;
  icon?: Component;
}

export const reportConfigs: Record<ReportKey, ReportConfig> = {
  inbound: {
    entity: 'inbound',
    title: 'Inbound Report',
    description: 'Recent receipts coming into each hub.',
    columns: [
      { key: 'docNo', label: 'Doc No' },
      { key: 'date', label: 'Date' },
      { key: 'partnerId', label: 'Supplier' },
      { key: 'status', label: 'Status' }
    ],
    partnerLabel: 'Supplier',
    partnerDataset: 'suppliers',
    partnerKey: 'partnerId',
    warehouseKey: 'warehouseId',
    icon: FileBarChart2
  },
  outbound: {
    entity: 'outbound',
    title: 'Outbound Report',
    description: 'Shipments and finished goods.',
    columns: [
      { key: 'docNo', label: 'Doc No' },
      { key: 'date', label: 'Date' },
      { key: 'partnerId', label: 'Customer' },
      { key: 'status', label: 'Status' }
    ],
    partnerLabel: 'Customer',
    partnerDataset: 'customers',
    partnerKey: 'partnerId',
    warehouseKey: 'warehouseId',
    icon: FileBarChart2
  },
  'stock-opname': {
    entity: 'opname',
    title: 'Stock Opname',
    description: 'Audit schedules by warehouse.',
    columns: [
      { key: 'docNo', label: 'Doc No' },
      { key: 'warehouseId', label: 'Warehouse' },
      { key: 'scheduledAt', label: 'Scheduled' },
      { key: 'status', label: 'Status' }
    ],
    warehouseKey: 'warehouseId',
    icon: ClipboardCheck
  },
  relocation: {
    entity: 'relocation',
    title: 'Relocation Report',
    description: 'Moving inventory between locations.',
    columns: [
      { key: 'docNo', label: 'Doc No' },
      { key: 'date', label: 'Date' },
      { key: 'sourceLocationId', label: 'Source' },
      { key: 'destinationLocationId', label: 'Destination' },
      { key: 'status', label: 'Status' }
    ],
    warehouseKey: 'sourceLocationId',
    icon: ArrowUpRight
  },
  transfer: {
    entity: 'transfer',
    title: 'Transfer Report',
    description: 'Inter-warehouse movements.',
    columns: [
      { key: 'docNo', label: 'Doc No' },
      { key: 'date', label: 'Date' },
      { key: 'sourceWarehouseId', label: 'From' },
      { key: 'destinationWarehouseId', label: 'To' },
      { key: 'status', label: 'Status' }
    ],
    warehouseKey: 'sourceWarehouseId',
    icon: Repeat
  },
  return: {
    entity: 'return',
    title: 'Return Report',
    description: 'Reverse logistics movements.',
    columns: [
      { key: 'docNo', label: 'Doc No' },
      { key: 'date', label: 'Date' },
      { key: 'customerId', label: 'Customer' },
      { key: 'productId', label: 'Product' },
      { key: 'status', label: 'Status' }
    ],
    partnerLabel: 'Customer',
    partnerDataset: 'customers',
    partnerKey: 'customerId',
    warehouseKey: 'warehouseId',
    icon: Activity
  },
  'current-stock': {
    entity: 'stock_balance',
    title: 'Current Stock',
    description: 'Live location balances.',
    columns: [
      { key: 'productId', label: 'Product' },
      { key: 'warehouseId', label: 'Warehouse' },
      { key: 'locationPath', label: 'Location' },
      { key: 'quantity', label: 'Quantity' }
    ],
    warehouseKey: 'warehouseId',
    icon: BarChart4
  },
  'stock-period': {
    entity: 'stock_period',
    title: 'Stock Period',
    description: 'Historical snapshots.',
    columns: [
      { key: 'period', label: 'Period' },
      { key: 'productId', label: 'Product' },
      { key: 'warehouseId', label: 'Warehouse' },
      { key: 'quantity', label: 'Quantity' }
    ],
    warehouseKey: 'warehouseId',
    icon: Clock4
  }
};
