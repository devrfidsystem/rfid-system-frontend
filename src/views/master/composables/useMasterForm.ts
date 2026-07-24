import { computed, reactive, ref, watch } from "vue";
import { useNotifier } from "@/composable/useNotifier";
import { masterService } from "@/services/master.service";
import { locationService } from "@/services/location.service";
import { productsService } from "@/services/products.service";
import { useAuthStore } from "@/store/auth.store";
import type { LocationRecord } from "@/model/entities";
import type { MasterRecord } from "../types";
import type {
    AttributeType,
    MasterEntityKey,
} from "@/api/feature/dto/master.dto";
import type { useMasterContext } from "./useMasterContext";
import type { useMasterTable } from "./useMasterTable";
import type { MasterFormField } from "../entityConfig";
import {
    buildMasterCreatePayload,
    buildMasterUpdatePayload,
} from "../masterPayload";
import { parseMasterExcelFile } from "../masterExcel";

type FormValue = string | File | null;

type ProductAttributeDefinition = {
    id: string;
    name: string;
    type: AttributeType;
    items?: Array<{ id: string; value: string; label: string }>;
};

const makeProductAttributeFields = (
    attributes: ProductAttributeDefinition[],
): MasterFormField[] =>
    attributes.map((attribute) => ({
        key: `attribute:${attribute.id}`,
        label: attribute.name,
        type:
            attribute.type === "number"
                ? "number"
                : attribute.type === "date"
                  ? "date"
                  : attribute.type === "list"
                    ? "select"
                    : "text",
        options:
            attribute.type === "list"
                ? (attribute.items ?? []).map((item) => ({
                      label: item.label || item.value,
                      value: item.id,
                  }))
                : undefined,
        placeholder:
            attribute.type === "list"
                ? `Select ${attribute.name}`
                : `Enter ${attribute.name}`,
    }));

const buildIndentedLocationLabel = (location: LocationRecord) => {
    const depth = Number(location.depth ?? 0);
    const prefix = depth > 0 ? `${"|-- ".repeat(depth)}` : "";
    return `${prefix}${location.name ?? location.path ?? location.code ?? location.id ?? ""}`;
};

export function useMasterForm(
    context: ReturnType<typeof useMasterContext>,
    table: ReturnType<typeof useMasterTable>,
) {
    const {
        entityKey,
        config,
        isMasterApiEntity,
        authStore,
        companyAwareEntities,
        ensureLocationWarehouseContext,
        locationWarehouseId,
        route,
    } = context;
    const { loadRows, loadError } = table;
    const { withToast, notifyError } = useNotifier();

    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const selectedRow = ref<MasterRecord | null>(null);
    const formState = reactive<Record<string, FormValue>>({});
    const uomSelectOptions = ref<{ label: string; value: string }[]>([]);
    const categorySelectOptions = ref<{ label: string; value: string }[]>([]);
    const supplierSelectOptions = ref<{ label: string; value: string }[]>([]);
    const customerSelectOptions = ref<{ label: string; value: string }[]>([]);
    const warehouseSelectOptions = ref<{ label: string; value: string }[]>([]);
    const locationSelectOptions = ref<{ label: string; value: string }[]>([]);
    const productAttributeDefinitions = ref<ProductAttributeDefinition[]>([]);
    const isSubmitting = ref(false);
    const isDeleting = ref(false);
    const isImporting = ref(false);

    const productAttributeFields = computed(() =>
        makeProductAttributeFields(productAttributeDefinitions.value),
    );

    const formFields = computed<MasterFormField[]>(() => {
        const fields = [...config.value.formFields];
        if (entityKey.value === "products") {
            const imageIndex = fields.findIndex(
                (field) => field.key === "imageFile",
            );
            const insertAt = imageIndex >= 0 ? imageIndex : fields.length;
            fields.splice(insertAt, 0, ...productAttributeFields.value);
        }
        return fields;
    });

    const resetForm = () => {
        formFields.value.forEach((field) => {
            formState[field.key] = field.type === "file" ? null : "";
        });
    };

    const loadProductReferenceData = async () => {
        if (entityKey.value !== "products") {
            uomSelectOptions.value = [];
            categorySelectOptions.value = [];
            supplierSelectOptions.value = [];
            customerSelectOptions.value = [];
            productAttributeDefinitions.value = [];
            return;
        }

        try {
            const params = authStore.currentCompanyId
                ? { companyId: authStore.currentCompanyId }
                : undefined;
            const [
                uomRecords,
                categoryRecords,
                supplierRecords,
                customerRecords,
                attributeResponse,
            ] = await Promise.all([
                masterService.fetchOptions("uoms", params),
                masterService.fetchOptions("product-categories", params),
                masterService.fetchOptions("suppliers", params),
                masterService.fetchOptions("customers", params),
                masterService.fetchList("attributes", {
                    ...(params ?? {}),
                    limit: 200,
                }),
            ]);
            const attributeRecords = attributeResponse.items;

            uomSelectOptions.value = uomRecords.map((uom) => ({
                value: String(uom.id),
                label: uom.name,
            }));
            categorySelectOptions.value = categoryRecords.map((category) => ({
                value: String(category.id),
                label: category.name,
            }));
            supplierSelectOptions.value = supplierRecords.map((supplier) => ({
                value: String(supplier.id),
                label: supplier.name,
            }));
            customerSelectOptions.value = customerRecords.map((customer) => ({
                value: String(customer.id),
                label: customer.name,
            }));
            productAttributeDefinitions.value = attributeRecords.map(
                (attribute) => ({
                    id: String(attribute.id),
                    name: attribute.name,
                    type: attribute.type as AttributeType,
                    items: Array.isArray(attribute.items)
                        ? attribute.items.map((item) => ({
                              id: String(item.id),
                              value: item.value,
                              label: item.label,
                          }))
                        : undefined,
                }),
            );
        } catch {
            notifyError("Gagal memuat referensi produk.");
        }
    };

    const loadLocationReferenceData = async () => {
        if (entityKey.value !== "locations") {
            warehouseSelectOptions.value = [];
            locationSelectOptions.value = [];
            return;
        }

        try {
            const params = authStore.currentCompanyId
                ? { companyId: authStore.currentCompanyId }
                : undefined;
            const warehouses = await masterService.fetchList("warehouses", {
                limit: 200,
                ...(params ?? {}),
            });
            warehouseSelectOptions.value = warehouses.items.map(
                (warehouse) => ({
                    value: String(warehouse.id),
                    label: warehouse.name,
                }),
            );

            const currentWarehouseId =
                formState.warehouseId?.toString() ||
                locationWarehouseId.value ||
                (await ensureLocationWarehouseContext()) ||
                "";
            if (currentWarehouseId) {
                formState.warehouseId = currentWarehouseId;
                await loadLocationOptions(currentWarehouseId);
            }
        } catch {
            notifyError("Gagal memuat referensi lokasi.");
        }
    };

    const loadLocationOptions = async (
        warehouseId: string,
        excludeId?: string,
    ) => {
        if (entityKey.value !== "locations") return;
        if (!warehouseId) {
            locationSelectOptions.value = [];
            return;
        }

        try {
            const params = authStore.currentCompanyId
                ? {
                      warehouseId,
                      limit: 200,
                      companyId: authStore.currentCompanyId,
                  }
                : { warehouseId, limit: 200 };
            const locations = await masterService.fetchList(
                "locations",
                params,
            );
            locationSelectOptions.value = locations.items
                .filter(
                    (location) =>
                        String(location.id) !== String(excludeId ?? ""),
                )
                .map((location) => ({
                    value: String(location.id),
                    label: buildIndentedLocationLabel(location),
                }));
        } catch {
            locationSelectOptions.value = [];
            notifyError("Gagal memuat parent location.");
        }
    };

    const applyLocationWarehouseContext = async (
        payload: Record<string, any>,
        row?: MasterRecord,
    ): Promise<void> => {
        if (entityKey.value !== "locations") return;
        const rowWarehouseId = row?.warehouseId;
        const selectedWarehouseId =
            typeof payload.warehouseId === "string" && payload.warehouseId
                ? payload.warehouseId
                : undefined;
        const contextWarehouseId =
            selectedWarehouseId ?? rowWarehouseId ?? locationWarehouseId.value;
        const warehouseId =
            contextWarehouseId ?? (await ensureLocationWarehouseContext());
        if (!warehouseId) {
            throw new Error("Lokasi membutuhkan gudang yang valid.");
        }
        payload.warehouseId = warehouseId;
    };

    const attachCompanyContext = (
        payload: Record<string, any>,
        row?: MasterRecord,
    ) => {
        const requiresCompany = companyAwareEntities.includes(
            entityKey.value as MasterEntityKey,
        );
        if (!requiresCompany) return;
        const companyId = row?.companyId ?? authStore.currentCompanyId;
        if (!companyId) {
            throw new Error(
                "Tidak ada perusahaan aktif untuk menyimpan data master ini.",
            );
        }
        payload.companyId = companyId;
    };

    const buildProductAttributeValues = (
        submittedData: Record<string, string | File | null>,
    ) => {
        if (entityKey.value !== "products") return undefined;

        const values: Array<{
            attributeId: string;
            attributeItemId?: string;
            valueText?: string;
            valueNumber?: number;
            valueDate?: string;
        }> = [];

        productAttributeDefinitions.value.forEach((attribute) => {
            const rawValue = submittedData[`attribute:${attribute.id}`];
            if (typeof rawValue !== "string") return;
            const trimmed = rawValue.trim();
            if (!trimmed) return;

            if (attribute.type === "number") {
                const numericValue = Number(trimmed);
                if (Number.isNaN(numericValue)) return;
                values.push({
                    attributeId: attribute.id,
                    valueNumber: numericValue,
                });
                return;
            }

            if (attribute.type === "date") {
                values.push({
                    attributeId: attribute.id,
                    valueDate: trimmed,
                });
                return;
            }

            if (attribute.type === "list") {
                values.push({
                    attributeId: attribute.id,
                    attributeItemId: trimmed,
                });
                return;
            }

            values.push({
                attributeId: attribute.id,
                valueText: trimmed,
            });
        });

        return values;
    };

    const getImageFile = (
        submittedData: Record<string, string | File | null>,
    ) => {
        const value = submittedData.imageFile;
        return typeof File !== "undefined" && value instanceof File
            ? value
            : null;
    };

    const toUpdatePayload = (payload: Record<string, any>) => {
        switch (entityKey.value) {
            case "warehouses":
                return {
                    name: payload.name,
                    address: payload.address,
                    description: payload.description,
                    isActive: payload.isActive,
                };
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

    const syncFormFromRow = async (row: MasterRecord) => {
        formFields.value.forEach((field) => {
            const value = row[field.key];
            formState[field.key] =
                value !== undefined && value !== null ? String(value) : "";
        });

        if (entityKey.value === "locations") {
            const warehouseId = String(row.warehouseId ?? "");
            if (warehouseId) {
                formState.warehouseId = warehouseId;
                await loadLocationOptions(warehouseId, row.id);
            }
        }

        if (entityKey.value === "products") {
            (row.attributeValues ?? []).forEach((attributeValue) => {
                const key = `attribute:${attributeValue.attributeId}`;
                if (attributeValue.attribute?.type === "number") {
                    formState[key] =
                        attributeValue.valueNumber !== undefined &&
                        attributeValue.valueNumber !== null
                            ? String(attributeValue.valueNumber)
                            : "";
                    return;
                }
                if (attributeValue.attribute?.type === "date") {
                    formState[key] = attributeValue.valueDate ?? "";
                    return;
                }
                if (attributeValue.attribute?.type === "list") {
                    formState[key] = attributeValue.attributeItemId ?? "";
                    return;
                }
                formState[key] =
                    attributeValue.valueText ?? attributeValue.value ?? "";
            });
        }
    };

    const openAdd = async () => {
        resetForm();
        if (!isMasterApiEntity(entityKey.value)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }

        if (entityKey.value === "locations") {
            const warehouseId =
                locationWarehouseId.value ??
                (await ensureLocationWarehouseContext());
            if (warehouseId) {
                formState.warehouseId = warehouseId;
                await loadLocationOptions(warehouseId);
            }
        }

        showAddModal.value = true;
    };

    const closeAdd = () => {
        showAddModal.value = false;
    };

    const openEdit = async (row: MasterRecord) => {
        selectedRow.value = row;
        await syncFormFromRow(row);
        showEditModal.value = true;
    };

    const closeEdit = () => {
        selectedRow.value = null;
        showEditModal.value = false;
    };

    const confirmDelete = (row: MasterRecord) => {
        selectedRow.value = row;
        showDeleteModal.value = true;
    };

    const closeDelete = () => {
        selectedRow.value = null;
        showDeleteModal.value = false;
    };

    const handleCreate = async (submittedData: Record<string, FormValue>) => {
        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        const masterKey = key as MasterEntityKey;

        const payload = buildMasterCreatePayload(masterKey, submittedData);
        if (!Object.keys(payload).length) return;

        const imageFile = getImageFile(submittedData);
        const attributeValues = buildProductAttributeValues(submittedData);
        if (attributeValues?.length) {
            payload.attributeValues = attributeValues;
        }
        delete payload.imageFile;

        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    await applyLocationWarehouseContext(payload);
                    attachCompanyContext(payload);
                    const response = await masterService.create(
                        masterKey,
                        payload as never,
                    );
                    const createdId = String(response.data.id ?? "");

                    if (key === "products" && createdId && imageFile) {
                        try {
                            await productsService.uploadProductImage(
                                createdId,
                                imageFile,
                            );
                        } catch {
                            notifyError(
                                "Produk tersimpan, tetapi upload gambar gagal.",
                            );
                        }
                    }
                },
                {
                    successMessage: `Created ${config.value.title}`,
                    errorMessage: `Failed to create ${config.value.title}`,
                },
            );
            closeAdd();
            await loadRows();
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleUpdate = async (submittedData: Record<string, FormValue>) => {
        const row = selectedRow.value;
        if (!row?.id) return;

        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        const masterKey = key as MasterEntityKey;
        const payload = buildMasterUpdatePayload(masterKey, submittedData);
        const imageFile = getImageFile(submittedData);
        const attributeValues = buildProductAttributeValues(submittedData);
        if (attributeValues?.length) {
            payload.attributeValues = attributeValues;
        }
        delete payload.imageFile;

        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    await applyLocationWarehouseContext(payload, row);
                    attachCompanyContext(payload, row);

                    if (key === "locations") {
                        await masterService.update(
                            masterKey,
                            String(row.id),
                            toUpdatePayload(payload) as never,
                        );

                        const nextParentId = payload.parentId ?? null;
                        const currentParentId = row.parentId ?? null;
                        if (nextParentId !== currentParentId) {
                            await locationService.move(
                                String(row.id),
                                nextParentId,
                            );
                        }
                        return;
                    }

                    await masterService.update(
                        masterKey,
                        String(row.id),
                        toUpdatePayload(payload) as never,
                    );

                    if (key === "products" && imageFile) {
                        try {
                            await productsService.uploadProductImage(
                                String(row.id),
                                imageFile,
                            );
                        } catch {
                            notifyError(
                                "Produk diperbarui, tetapi upload gambar gagal.",
                            );
                        }
                    }
                },
                {
                    successMessage: `Updated ${config.value.title}`,
                    errorMessage: `Failed to update ${config.value.title}`,
                },
            );
            closeEdit();
            await loadRows();
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleDelete = async () => {
        const row = selectedRow.value;
        if (!row?.id) return;
        const key = entityKey.value;
        isDeleting.value = true;
        try {
            await withToast(
                async () => {
                    if (
                        !isMasterApiEntity(key) ||
                        !masterService.isRemovable(key)
                    ) {
                        throw new Error(
                            "API endpoint not removable or not available.",
                        );
                    }
                    await masterService.remove(key, String(row.id));
                },
                {
                    successMessage: `Deleted ${config.value.title}`,
                    errorMessage: `Failed to delete ${config.value.title}`,
                },
            );
            closeDelete();
            await loadRows();
        } finally {
            isDeleting.value = false;
        }
    };

    const resolveImportFieldValue = (
        row: Record<string, string>,
        field: MasterFormField,
    ) => row[field.key] ?? row[field.label] ?? "";

    const buildSubmittedDataFromImportRow = (row: Record<string, string>) =>
        formFields.value.reduce<Record<string, FormValue>>((acc, field) => {
            if (field.type === "file") return acc;
            const value = resolveImportFieldValue(row, field);
            if (value) {
                acc[field.key] = value;
            }
            return acc;
        }, {});

    const handleImport = async (file: File) => {
        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        const masterKey = key as MasterEntityKey;
        isImporting.value = true;
        try {
            await withToast(
                async () => {
                    const importedRows = await parseMasterExcelFile(file);
                    if (!importedRows.length) {
                        throw new Error("Excel file does not contain data.");
                    }

                    for (const row of importedRows) {
                        const submittedData =
                            buildSubmittedDataFromImportRow(row);
                        const payload = buildMasterCreatePayload(
                            masterKey,
                            submittedData,
                        );
                        if (!Object.keys(payload).length) continue;
                        const attributeValues =
                            buildProductAttributeValues(submittedData);
                        if (attributeValues?.length) {
                            payload.attributeValues = attributeValues;
                        }
                        await applyLocationWarehouseContext(payload);
                        attachCompanyContext(payload);
                        await masterService.create(masterKey, payload as never);
                    }
                },
                {
                    successMessage: `Imported ${config.value.title}`,
                    errorMessage: `Failed to import ${config.value.title}`,
                },
            );
            await loadRows();
        } finally {
            isImporting.value = false;
        }
    };

    const resetFormState = () => {
        resetForm();
        selectedRow.value = null;
        closeAdd();
        closeEdit();
        closeDelete();
    };

    watch(
        entityKey,
        () => {
            resetFormState();
            void loadProductReferenceData();
            void loadLocationReferenceData();
        },
        { immediate: true },
    );

    watch(
        () => authStore.currentCompanyId,
        () => {
            if (entityKey.value === "products") void loadProductReferenceData();
            if (entityKey.value === "locations")
                void loadLocationReferenceData();
        },
    );

    watch(
        () => formState.warehouseId,
        (warehouseId, oldWarehouseId) => {
            if (entityKey.value !== "locations") return;
            const nextWarehouseId = String(warehouseId ?? "");
            if (!nextWarehouseId) {
                locationSelectOptions.value = [];
                return;
            }
            void loadLocationOptions(nextWarehouseId, selectedRow.value?.id);
            if (oldWarehouseId && oldWarehouseId !== warehouseId) {
                formState.parentId = "";
            }
        },
    );

    watch(
        () => productAttributeDefinitions.value,
        () => {
            if (entityKey.value !== "products" || !selectedRow.value) return;
            void syncFormFromRow(selectedRow.value);
        },
    );

    watch(
        () => route.fullPath,
        () => {
            closeAdd();
            closeEdit();
            closeDelete();
        },
    );

    return {
        showAddModal,
        showEditModal,
        showDeleteModal,
        formState,
        formFields,
        uomSelectOptions,
        categorySelectOptions,
        supplierSelectOptions,
        customerSelectOptions,
        warehouseSelectOptions,
        locationSelectOptions,
        isSubmitting,
        isDeleting,
        isImporting,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleImport,
    };
}
