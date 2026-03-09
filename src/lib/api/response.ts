export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  status?: number;
  errors?: Record<string, string[] | string>;
  meta?: ApiMeta;
}
