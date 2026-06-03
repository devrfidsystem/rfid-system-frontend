export interface ApiFieldError {
    field: string;
    message: string;
}

export interface ParsedApiError {
    message: string;
    fieldErrors: Record<string, string>;
    status?: number;
}

export function parseApiError(err: unknown): ParsedApiError {
    const axiosErr = err as
        | { response?: { data?: unknown; status?: number }; message?: string }
        | undefined;
    const res = axiosErr?.response?.data;

    const fieldErrors: Record<string, string> = {};

    if (res && typeof res === "object" && res !== null) {
        const maybe = res as Record<string, unknown>;
        if (Array.isArray(maybe.errors)) {
            (maybe.errors as unknown[]).forEach((e) => {
                if (e && typeof e === "object") {
                    const obj = e as Record<string, unknown>;
                    const field =
                        typeof obj.field === "string" ? obj.field : undefined;
                    const message =
                        typeof obj.message === "string" ? obj.message : "";
                    if (field) fieldErrors[field] = message;
                }
            });
        }
        const message =
            typeof maybe.message === "string"
                ? maybe.message
                : axiosErr?.message;
        const status =
            typeof maybe.statusCode === "number"
                ? maybe.statusCode
                : axiosErr?.response?.status;
        return {
            message: message ?? "Terjadi kesalahan, coba lagi.",
            fieldErrors,
            status,
        };
    }

    return {
        message: axiosErr?.message ?? "Terjadi kesalahan, coba lagi.",
        fieldErrors,
        status: axiosErr?.response?.status,
    };
}

export default parseApiError;
