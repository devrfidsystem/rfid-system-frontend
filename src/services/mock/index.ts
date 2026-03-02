import attributesData from './data/attributes.json';
import categoriesData from './data/categories.json';
import customersData from './data/customers.json';
import suppliersData from './data/suppliers.json';
import warehousesData from './data/warehouses.json';
import locationsData from './data/locations.json';
import uomsData from './data/uoms.json';
import productsData from './data/products.json';
import tagRegistrationsData from './data/tag_registrations.json';
import epcEventsData from './data/epc_events.json';
import inboundData from './data/inbound.json';
import outboundData from './data/outbound.json';
import relocationData from './data/relocation.json';
import transferData from './data/transfer.json';
import returnData from './data/return.json';
import opnameData from './data/opname.json';
import stockBalanceData from './data/stock_balance.json';
import stockPeriodData from './data/stock_period.json';

import type {
  EntityKey,
  EntityMap,
  ListParams,
  PaginatedResult
} from '@/types/entities';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

type EntityRecord<K extends EntityKey> = EntityMap[K][number];

const store: EntityMap = {
  attributes: clone(attributesData),
  categories: clone(categoriesData),
  customers: clone(customersData),
  suppliers: clone(suppliersData),
  warehouses: clone(warehousesData),
  locations: clone(locationsData),
  uoms: clone(uomsData),
  products: clone(productsData),
  tag_registrations: clone(tagRegistrationsData),
  epc_events: clone(epcEventsData),
  inbound: clone(inboundData),
  outbound: clone(outboundData),
  relocation: clone(relocationData),
  transfer: clone(transferData),
  return: clone(returnData),
  opname: clone(opnameData),
  stock_balance: clone(stockBalanceData),
  stock_period: clone(stockPeriodData)
};

const simulateDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const keywordFilter = <T extends Record<string, unknown>>(record: T, keyword?: string) => {
  if (!keyword) return true;
  const text = Object.values(record)
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).toLowerCase())
    .join(' ');
  return text.includes(keyword.toLowerCase());
};

const matchesFilters = <T extends Record<string, unknown>>(record: T, filters?: Record<string, string>) => {
  if (!filters) return true;
  return Object.entries(filters).every(([prop, value]) => {
    const target = record[prop as keyof T];
    if (target === undefined) return false;
    return String(target).toLowerCase().includes(value.toLowerCase());
  });
};

const extractDate = (record: Record<string, unknown>): string | undefined => {
  const preferred = ['date', 'createdAt', 'timestamp', 'scheduledAt'];
  return preferred.reduce<string | undefined>((acc, key) => acc ?? (record[key] as string | undefined), undefined);
};

const withinDateRange = (record: Record<string, unknown>, start?: string, end?: string) => {
  if (!start && !end) return true;
  const value = extractDate(record);
  if (!value) return true;
  const date = new Date(value);
  const afterStart = start ? date >= new Date(start) : true;
  const beforeEnd = end ? date <= new Date(end) : true;
  return afterStart && beforeEnd;
};

const applyFilters = <K extends EntityKey>(entity: K, records: EntityMap[K], params: ListParams) => {
  return records.filter((record) => {
    return (
      keywordFilter(record as Record<string, unknown>, params.keyword) &&
      matchesFilters(record as Record<string, unknown>, params.filters) &&
      withinDateRange(record as Record<string, unknown>, params.startDate, params.endDate)
    );
  });
};

export const list = async <K extends EntityKey>(entity: K, params: ListParams = {}): Promise<PaginatedResult<EntityMap[K]>> => {
  await simulateDelay();
  const dataset = [...store[entity]];
  const filtered = applyFilters(entity, dataset, params);
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? 10;
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);
  return {
    data,
    page,
    perPage,
    total: filtered.length
  };
};

export const getById = async <K extends EntityKey>(entity: K, id: string): Promise<EntityRecord<K> | null> => {
  await simulateDelay();
  return store[entity].find((record) => record.id === id) ?? null;
};

const generateId = (entity: EntityKey) =>
  `${entity}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const ensureTimestamp = (record: Record<string, unknown>): void => {
  if ('createdAt' in record && !record.createdAt) {
    record.createdAt = new Date().toISOString();
  }
  if ('date' in record && !record.date) {
    record.date = new Date().toISOString().split('T')[0];
  }
  if ('timestamp' in record && !record.timestamp) {
    record.timestamp = new Date().toISOString();
  }
};

export const create = async <K extends EntityKey>(entity: K, payload: Partial<EntityRecord<K>>): Promise<EntityRecord<K>> => {
  await simulateDelay();
  const records = store[entity];
  const newRecord = {
    ...payload,
    id: payload.id ?? generateId(entity)
  } as EntityRecord<K> & Record<string, unknown>;
  ensureTimestamp(newRecord);
  records.unshift(newRecord as EntityRecord<K>);
  return newRecord as EntityRecord<K>;
};

export const update = async <K extends EntityKey>(entity: K, id: string, payload: Partial<EntityRecord<K>>): Promise<EntityRecord<K> | null> => {
  await simulateDelay();
  const records = store[entity];
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;
  const updated = { ...records[index], ...payload } as EntityRecord<K>;
  records[index] = updated;
  return updated;
};

export const remove = async <K extends EntityKey>(entity: K, id: string): Promise<boolean> => {
  await simulateDelay();
  const records = store[entity];
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  return true;
};
