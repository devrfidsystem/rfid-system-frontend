import axios, {
    type AxiosError,
    type AxiosRequestConfig,
    type ParamsSerializerOptions,
} from "axios";
import router from "@/router";
import { useNotificationStore } from "@/store/notification.store";
import { parseApiError } from "@/lib/api/parseApiError";
import type { ApiResponse } from "@/lib/api/response";
import type { ResponseErrorDto } from "@/api/feature/dto/common.dto";

// import.meta.env is a Vite runtime object; TypeScript may not know its shape in this repo's config.
// Use a local cast to keep this module compiling; consider adding a global env.d.ts later.
// Helper to safely read Vite env vars when project has no global ImportMetaEnv typings
function getViteEnvVar(key: string): string | undefined {
    const env = import.meta.env as Record<string, string | undefined>;
    return env[key];
}

const baseAPIBase = getViteEnvVar("VITE_API_BASE_URL");
const apiPrefix = "/api/v1";
const baseURL = baseAPIBase
    ? `${baseAPIBase.replace(/\/$/, "")}${apiPrefix}`
    : baseAPIBase;

type QueryParamValue =
    | string
    | number
    | boolean
    | Array<string | number | boolean>;

const serializeQueryParams = (
    params?: Record<string, QueryParamValue | undefined>,
): string => {
    const searchParams = new URLSearchParams();
    if (!params) {
        return "";
    }
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => searchParams.append(key, String(item)));
            return;
        }
        searchParams.append(key, String(value));
    });
    return searchParams.toString();
};

const paramsSerializer: ParamsSerializerOptions = {
    serialize: serializeQueryParams,
};

const apiClient = axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
        "Content-Type": "application/json",
    },
    paramsSerializer,
});

// Runtime helper: read import.meta.env at call time and normalize
function getRuntimeApiBase(): string {
    const env = import.meta.env as Record<string, string | undefined>;
    const raw = env.VITE_API_BASE_URL ?? "";
    const val = String(raw || "")
        .replaceAll('"', "")
        .replaceAll("'", "")
        .trim();
    return val ? `${val.replace(/\/$/, "")}${apiPrefix}` : "";
}

function ensureApiClientBaseURL() {
    // If axios instance was created without baseURL (module-init saw empty env), set it now
    if (!apiClient.defaults.baseURL) {
        const runtime = getRuntimeApiBase();
        if (runtime) {
            apiClient.defaults.baseURL = runtime;
        }
    }
}

apiClient.interceptors.request.use(async (config) => {
    // axios headers typing can be strict; operate on a plain object then assign back
    const existingHeaders = (config.headers ?? {}) as Record<string, unknown>;
    const token = localStorage.getItem("access_token");

    if (token && !("Authorization" in existingHeaders)) {
        existingHeaders.Authorization = `Bearer ${token}`;
    }

    const merged = {
        ...existingHeaders,
        ...(config.method === "get"
            ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
            : {}),
    } as Record<string, unknown>;

    // assign back to config.headers with a cast to avoid strict Axios header typing issues
    config.headers = merged as import("axios").AxiosRequestHeaders;

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const requestConfig = error.config as ApiRequestConfig | undefined;
        if (
            error.response?.status === 401 &&
            !requestConfig?.skipAuthErrorHandling
        ) {
            const refreshToken = localStorage.getItem("refresh_token");

            if (refreshToken && requestConfig && !requestConfig._retry) {
                requestConfig._retry = true;

                try {
                    const { data } = await axios.post<{
                        data: { accessToken: string; refreshToken: string };
                    }>(`${apiClient.defaults.baseURL}/auth/refresh`, {
                        refreshToken,
                    });

                    if (data?.data?.accessToken) {
                        localStorage.setItem(
                            "access_token",
                            data.data.accessToken,
                        );
                        localStorage.setItem(
                            "refresh_token",
                            data.data.refreshToken,
                        );

                        if (requestConfig.headers) {
                            requestConfig.headers.Authorization = `Bearer ${data.data.accessToken}`;
                        }

                        return apiClient(requestConfig);
                    }
                } catch {
                    // Refresh failed, fall through to logout
                }
            }

            // Fallback: Clear tokens and redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (router.currentRoute.value?.fullPath !== "/login") {
                void router.push("/login");
            }
        }
        // handle 403 explicitly: show access denied toast
        if (error.response?.status === 403) {
            try {
                const store = useNotificationStore();
                const parsed = parseApiError(error);
                store.notify(parsed.message ?? "Akses ditolak", {
                    variant: "error",
                });
            } catch {
                // swallow
            }
        }
        throw normalizeAxiosError(error);
    },
);

const normalizeAxiosError = (error: AxiosError): ApiClientError => {
    const status = error.response?.status;
    const payload = error.response?.data as ApiResponse<unknown> | undefined;

    let message = payload?.message ?? error.message ?? "Unknown API error";
    const metaErrors = payload?.meta?.errors;
    if (Array.isArray(metaErrors) && metaErrors.length > 0) {
        message = metaErrors.join(", ");
    }

    return new ApiClientError(message, status, payload?.error ?? null, payload);
};

const assertSuccess = <T>(response: ApiResponse<T>): ApiResponse<T> => {
    if (!response.success) {
        throw new ApiClientError(
            response.message ?? "Request failed",
            undefined,
            response.error,
            response,
        );
    }
    return response;
};

export class ApiClientError extends Error {
    public status?: number;
    public responseError: ResponseErrorDto | null;
    public response?: ApiResponse<unknown>;

    constructor(
        message: string,
        status?: number,
        responseError: ResponseErrorDto | null = null,
        response?: ApiResponse<unknown>,
    ) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.responseError = responseError;
        this.response = response;
        Object.setPrototypeOf(this, ApiClientError.prototype);
    }
}

export interface ApiRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
    skipAuthErrorHandling?: boolean;
    _retry?: boolean;
}

const apiRequest = async <T, D = unknown>(
    config: ApiRequestConfig<D>,
): Promise<ApiResponse<T>> => {
    // ensure baseURL is set from runtime env if it was missing at module init
    try {
        ensureApiClientBaseURL();
    } catch {
        // ignore
    }
    const response = await apiClient.request<ApiResponse<T>>(config);
    return assertSuccess(response.data);
};

export { apiClient, apiRequest };
