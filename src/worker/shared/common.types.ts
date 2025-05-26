export interface BaseResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> extends BaseResponse {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface SingleResponse<T> extends BaseResponse {
    data: T;
}

export interface ErrorResponse extends BaseResponse {
    success: false;
    error: string;
}

export interface EmptyResponse extends BaseResponse {
    success: true;
}
