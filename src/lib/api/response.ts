import type {
    ApiMetaDto,
    ApiResponseDto,
    ResponseErrorDto,
} from "@/api/feature/dto/common.dto";

export type ApiMeta = ApiMetaDto;
export type ApiResponse<T> = ApiResponseDto<T>;
export type ApiErrorResponse = ResponseErrorDto;

export interface ApiPaginatedResult<T> {
    items: T[];
    meta: ApiMeta | null;
}
