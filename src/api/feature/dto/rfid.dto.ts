export type RfidTagStatus =
    | "available"
    | "in_use"
    | "quarantined"
    | "retired"
    | "encoded"
    | "assigned";

export interface RfidTag {
    id: string;
    epcCode: string;
    status: RfidTagStatus;
    productId: string | null;
    companyId: string;
    warehouseId?: string | null;
    locationId?: string | null;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterEpcTagDto {
    companyId: string;
    productId: string;
    epcCode: string;
    metadata?: Record<string, unknown>;
}

export interface EncodeEpcTagDto {
    readerId?: string;
}

export interface TransitionEpcStatusDto {
    status: RfidTagStatus;
}

export interface AssignEpcTagDto {
    locationId: string;
    docReference?: string;
}

export interface RfidTagListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: RfidTagStatus;
    warehouseId?: string;
    productId?: string;
}

export interface LogEpcEventDto {
    epcTagId: string;
    eventType: string;
    payload?: Record<string, unknown>;
    readerId?: string;
}

// backward-compat alias (if any code still imports RfidEventDto)
export type RfidEventDto = LogEpcEventDto;
