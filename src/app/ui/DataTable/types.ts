import type { VNode } from 'vue';

export type ColumnAccessor<T> = (row: T) => string | number | boolean | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: ColumnAccessor<T>;
  cell?: (row: T) => string | VNode | null;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface DataTableOptions {
  initialSort?: SortState;
  pageSizeOptions?: number[];
  selectable?: boolean;
}
