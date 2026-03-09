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
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (token) {
    const headers = config.headers ?? {};
    config.headers = {
      ...headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await supabase.auth.signOut();
      } finally {
        if (router.currentRoute.value?.fullPath !== '/auth/login') {
          void router.push('/auth/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export type ApiRequestConfig<D = unknown> = AxiosRequestConfig<D>;

const apiRequest = async <T, D = unknown>(config: ApiRequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data;
};

export { apiClient, apiRequest };
