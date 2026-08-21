import type { EntityKey } from "@/model/entities";
import type { MasterRecord } from "@/domain/master/types";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import type { MasterSubmittedData } from "./masterFormTypes";
import { masterService } from "@/services/master.service";
import { locationService } from "@/services/location.service";
import { productsService } from "@/services/products.service";

type ApplyLocationWarehouseContext = (
    payload: Record<string, unknown>,
    row?: MasterRecord,
) => Promise<void>;

type AttachCompanyContext = (
    payload: Record<string, unknown>,
    row?: MasterRecord,
) => void;

type NotifyError = (message: string) => void;

export const getMasterImageFile = (submittedData: MasterSubmittedData) => {
    const value = submittedData.imageFile;
    return typeof File !== "undefined" && value instanceof File ? value : null;
};

export const toMasterUpdatePayload = (
    entityKey: EntityKey,
    payload: Record<string, unknown>,
) => {
    switch (entityKey) {
        case "warehouses":
            return {
                name: payload.name,
                address: payload.address,
                description: payload.description,
                isActive: payload.isActive,
            };
        case "customers":
        case "suppliers":
            return {
                name: payload.name,
                address: payload.address,
                phone: payload.phone,
                description: payload.description,
                isActive: payload.isActive,
            };
        case "uoms":
            return {
                name: payload.name,
                symbol: payload.symbol,
            };
        case "product-categories":
        case "locations":
            return {
                name: payload.name,
            };
        case "attributes":
            return {
                name: payload.name,
                type: payload.type,
                items: payload.items,
            };
        case "products":
            return {
                categoryId: payload.categoryId,
                uomId: payload.uomId,
                supplierId: payload.supplierId,
                customerId: payload.customerId,
                name: payload.name,
                qtyMin: payload.qtyMin,
                qtyMax: payload.qtyMax,
                unitType: payload.unitType,
                unitName: payload.unitName,
                conversionFactor: payload.conversionFactor,
                imageUrl: payload.imageUrl,
                attributeValues: payload.attributeValues,
            };
        default:
            return payload;
    }
};

export const createMasterRecord = async ({
    entityKey,
    masterKey,
    payload,
    imageFile,
    applyLocationWarehouseContext,
    attachCompanyContext,
    notifyError,
}: {
    entityKey: EntityKey;
    masterKey: MasterEntityKey;
    payload: Record<string, unknown>;
    imageFile: File | null;
    applyLocationWarehouseContext: ApplyLocationWarehouseContext;
    attachCompanyContext: AttachCompanyContext;
    notifyError: NotifyError;
}) => {
    await applyLocationWarehouseContext(payload);
    attachCompanyContext(payload);
    const response = await masterService.create(masterKey, payload as never);
    const createdId = String(response.data.id ?? "");

    if (entityKey === "products" && createdId && imageFile) {
        try {
            await productsService.uploadProductImage(createdId, imageFile);
        } catch {
            notifyError("Produk tersimpan, tetapi upload gambar gagal.");
        }
    }
};

export const updateMasterRecord = async ({
    entityKey,
    masterKey,
    row,
    payload,
    imageFile,
    applyLocationWarehouseContext,
    attachCompanyContext,
    notifyError,
}: {
    entityKey: EntityKey;
    masterKey: MasterEntityKey;
    row: MasterRecord;
    payload: Record<string, unknown>;
    imageFile: File | null;
    applyLocationWarehouseContext: ApplyLocationWarehouseContext;
    attachCompanyContext: AttachCompanyContext;
    notifyError: NotifyError;
}) => {
    await applyLocationWarehouseContext(payload, row);
    attachCompanyContext(payload, row);

    await masterService.update(
        masterKey,
        String(row.id),
        toMasterUpdatePayload(entityKey, payload) as never,
    );

    if (entityKey === "locations") {
        const nextParentId =
            typeof payload.parentId === "string" ? payload.parentId : null;
        const currentParentId = row.parentId ?? null;
        if (nextParentId !== currentParentId) {
            await locationService.move(String(row.id), nextParentId);
        }
        return;
    }

    if (entityKey === "products" && imageFile) {
        try {
            await productsService.uploadProductImage(String(row.id), imageFile);
        } catch {
            notifyError("Produk diperbarui, tetapi upload gambar gagal.");
        }
    }
};

export const deleteMasterRecord = async (
    masterKey: MasterEntityKey,
    id: string,
) => {
    if (!masterService.isRemovable(masterKey)) {
        throw new Error("API endpoint not removable or not available.");
    }
    await masterService.remove(masterKey, id);
};
