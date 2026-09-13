export type ResponseErrorCode =
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "BUSINESS_RULE_VIOLATION"
    | "INTERNAL_SERVER_ERROR"
    | "SERVICE_UNAVAILABLE";

export interface ErrorDetailDto {
    field: string;
    message: string;
}

export interface ResponseErrorDto {
    code: ResponseErrorCode;
    details: ErrorDetailDto[] | null;
}

export interface ApiMetaDto {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    generatedAt?: string;
    errors?: string[];
}

export interface ApiResponseDto<T> {
    success: boolean;
    message: string;
    data: T;
    error: ResponseErrorDto | null;
    meta: ApiMetaDto | null;
}
