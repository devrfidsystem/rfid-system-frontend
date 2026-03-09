import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import router from '@/app/router';
import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/api/response';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not configured');
}

const apiClient = axios.create({
  baseURL,
  timeout: 30_000
});

apiClient.interceptors.request.use(async (config) => {
  const headers = config.headers ?? {};
  const sessionResponse = await supabase.auth.getSession();
  const token = sessionResponse.data.session?.access_token;

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  config.headers = {
    ...headers,
    ...(config.method === 'get' ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } : {})
  };

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as ApiRequestConfig | undefined;
    if (error.response?.status === 401 && !requestConfig?.skipAuthErrorHandling) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        try {
          await supabase.auth.signOut();
        } finally {
          if (router.currentRoute.value?.fullPath !== '/auth/login') {
            void router.push('/auth/login');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  skipAuthErrorHandling?: boolean;
}

const apiRequest = async <T, D = unknown>(config: ApiRequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data;
};

export { apiClient, apiRequest };
