import { apiRequest } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/response';

export interface EpcTag {
  id: string;
  epcCode: string;
  status: 'draft' | 'encoded' | 'assigned' | 'active' | 'inactive';
  productId: string | null;
  sku?: string | null;
  barcode?: string | null;
  warehouseId?: string | null;
  locationId?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EpcAssignment {
  id: string;
  epcTagId: string;
  productId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface EpcEvent {
  id: string;
  epcTagId: string;
  eventType: 'encode' | 'assign' | 'scan' | 'unassign';
  source: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export interface RegisterEpcPayload {
  epcCode: string;
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EncodeEpcPayload {
  epcTagId: string;
  epcCode: string;
  productId: string;
  sku?: string;
  barcode?: string;
}

export interface AssignEpcPayload {
  epcTagId: string;
  productId: string;
  userId?: string;
}

export interface EpcTagListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: EpcTag['status'];
  warehouseId?: string;
  productId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface EpcEventListParams {
  epcTagId?: string;
  limit?: number;
  page?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const BASE_PATH = '/api/v1/rfid';

export const rfidService = {
  listTags(params: EpcTagListParams = {}): Promise<ApiResponse<EpcTag[]>> {
    return apiRequest<EpcTag[]>({
      url: `${BASE_PATH}/tags`,
      method: 'get',
      params
    });
  },

  getTagById(id: string): Promise<ApiResponse<EpcTag>> {
    return apiRequest<EpcTag>({ url: `${BASE_PATH}/tags/${id}`, method: 'get' });
  },

  registerTag(payload: RegisterEpcPayload): Promise<ApiResponse<EpcTag>> {
    return apiRequest<EpcTag>({ url: `${BASE_PATH}/tags`, method: 'post', data: payload });
  },

  encodeTag(payload: EncodeEpcPayload): Promise<ApiResponse<EpcTag>> {
    return apiRequest<EpcTag>({ url: `${BASE_PATH}/tags/${payload.epcTagId}/encode`, method: 'post', data: payload });
  },

  assignTag(payload: AssignEpcPayload): Promise<ApiResponse<EpcAssignment>> {
    return apiRequest<EpcAssignment>({ url: `${BASE_PATH}/assignments`, method: 'post', data: payload });
  },

  listEvents(params: EpcEventListParams = {}): Promise<ApiResponse<EpcEvent[]>> {
    return apiRequest<EpcEvent[]>({ url: `${BASE_PATH}/events`, method: 'get', params });
  }
};
