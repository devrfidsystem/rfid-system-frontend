import type { EntityKey } from '@/types/entities';
import type { Component } from 'vue';
import { Box, Grid, Layers, MapPin, Ruler, Truck, Users, Warehouse } from 'lucide-vue-next';

export interface MasterEntityConfig {
  entity: EntityKey;
  title: string;
  description: string;
  columns: { key: string; label: string }[];
  formFields: { key: string; label: string; type?: 'text' | 'textarea' }[];
  icon: Component;
}

export const masterEntities: Record<MasterEntityConfig['entity'], MasterEntityConfig> = {
  attributes: {
    entity: 'attributes',
    title: 'Attributes',
    description: 'Metadata that describes SKU characteristics.',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'group', label: 'Group' },
      { key: 'createdAt', label: 'Created At' }
    ],
    formFields: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'group', label: 'Group' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ],
    icon: Layers
  },
  categories: {
    entity: 'categories',
    title: 'Category Catalog',
    description: 'Organize goods into structured categories.',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Created At' }
    ],
    formFields: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ],
    icon: Grid
  },
  customers: {
    entity: 'customers',
    title: 'Customer Master',
    description: 'Profiles and SLAs for customers.',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'segment', label: 'Segment' },
      { key: 'region', label: 'Region' }
    ],
    formFields: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'segment', label: 'Segment' },
      { key: 'region', label: 'Region' }
    ],
    icon: Users
  },
  suppliers: {
    entity: 'suppliers',
    title: 'Supplier Master',
    description: 'Approved source partners.',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'contact', label: 'Contact' },
      { key: 'region', label: 'Region' }
    ],
    formFields: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'contact', label: 'Contact' },
      { key: 'region', label: 'Region' }
    ]
    ,
    icon: Truck
  },
  warehouses: {
    entity: 'warehouses',
    title: 'Warehouse Master',
    description: 'Manage facility definitions.',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'region', label: 'Region' },
      { key: 'manager', label: 'Manager' }
    ],
    formFields: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'region', label: 'Region' },
      { key: 'manager', label: 'Manager' }
    ]
    ,
    icon: Warehouse
  },
  locations: {
    entity: 'locations',
    title: 'Location Master',
    description: 'Map rows/columns to semantic sections.',
    columns: [
      { key: 'path', label: 'Path' },
      { key: 'rowNo', label: 'Row' },
      { key: 'colNo', label: 'Col' },
      { key: 'section', label: 'Section' }
    ],
    formFields: [
      { key: 'path', label: 'Path' },
      { key: 'rowNo', label: 'Row', type: 'text' },
      { key: 'colNo', label: 'Column', type: 'text' },
      { key: 'section', label: 'Section' }
    ]
    ,
    icon: MapPin
  },
  uoms: {
    entity: 'uoms',
    title: 'Unit of Measure',
    description: 'Standardize packaging units.',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' }
    ],
    formFields: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
    ,
    icon: Ruler
  },
  products: {
    entity: 'products',
    title: 'Product Master',
    description: 'Catalog of RFID-enabled products.',
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' }
    ],
    formFields: [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' }
    ]
    ,
    icon: Box
  }
};
