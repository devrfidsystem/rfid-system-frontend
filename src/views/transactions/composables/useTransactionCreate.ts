import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { masterService } from "@/services/master.service";
import { usersService } from "@/services/users.service";
import { locationService } from "@/services/location.service";
import { stockService } from "@/services/stock.service";
import { useNotifier } from "@/composable/useNotifier";
import { useAuthStore } from "@/store/auth.store";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import { formatProductAttributeSummary } from "@/utils/productAttributes";
import type { ProductRecord } from "@/model/entities";
import { buildDefaultDocumentNumber } from "../utils/documentNumber";

export interface ProductUomInfo {
    baseUomId: string;
    baseLabel: string;
    unitName?: string | null;
    conversionFactor?: number | null;
    breakdownUomId?: string | null;
}

export function useTransactionCreate(
    transactionKey: TransactionKey,
    transactionId?: string,
) {
    const router = useRouter();
    const { notifyError, notifySuccess } = useNotifier();
    const authStore = useAuthStore();
    const submitting = ref(false);

    const companyId = computed(() => authStore.currentCompanyId);

    const form = ref({
        docNumber: buildDefaultDocumentNumber(transactionKey),
        transactionDate: new Date().toISOString().split("T")[0],
        title: "",
        period: "",
        warehouseId: "",
        locationId: "",
        fromWarehouseId: "",
        toWarehouseId: "",
        fromLocationId: "",
        toLocationId: "",
        partnerId: "",
        assignedById: "",
        deadlineAt: "",
        registeredById: "",
        referenceType: "",
        referenceId: "",
        notes: "",
        lines: [] as {
            productId: string;
            qty: string;
            locationId: string;
            fromLocationId: string;
            toLocationId: string;
            enteredUomId: string;
            enteredQty: string;
        }[],
    });

    const transactionTitle = computed(() => {
        const titles: Record<string, string> = {
            register: "Register Task",
            inbound: "Inbound Document",
            outbound: "Outbound Assignment",
            putaway: "Putaway",
            relocation: "Relocation",
            return: "Return",
            returns: "Return",
            opname: "Stock Opname",
        };
        return titles[transactionKey] || transactionKey;
    });

    const isRelocation = computed(() => transactionKey === "relocation");
    const isOpname = computed(() => transactionKey === "opname");
    const isRegister = computed(() => transactionKey === "register");
    const isOutbound = computed(() => transactionKey === "outbound");
    const isPutaway = computed(() => transactionKey === "putaway");
    const isEditMode = computed(() => Boolean(transactionId));

    const showSingleWarehouse = computed(() =>
        [
            "inbound",
            "putaway",
            "outbound",
            "return",
            "returns",
            "opname",
        ].includes(transactionKey),
    );
    const showDualWarehouse = computed(() => false);
    const showPutawayLocations = computed(() => isPutaway.value);
    const putawayTargetLocationId = ref("");

    const showPartnerField = computed(() => {
        return ["inbound", "outbound", "return", "returns"].includes(
            transactionKey,
        );
    });

    const partnerLabel = computed(() => {
        return transactionKey === "inbound" ? "Supplier" : "Customer";
    });

    const warehouseOptions = ref<{ label: string; value: string }[]>([]);
    const partnerOptions = ref<{ label: string; value: string }[]>([]);
    const productOptions = ref<{ label: string; value: string }[]>([]);
    const productRecords = ref<ProductRecord[]>([]);
    const productAttributeSummaries = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        productRecords.value.forEach((product) => {
            const summary = formatProductAttributeSummary(
                product.attributeValues,
            );
            if (summary) map[String(product.id)] = summary;
        });
        return map;
    });
    const productUomInfo = computed<Record<string, ProductUomInfo>>(() => {
        const map: Record<string, ProductUomInfo> = {};
        productRecords.value.forEach((product) => {
            map[String(product.id)] = {
                baseUomId: product.uom?.id ?? "",
                baseLabel: product.uom?.symbol || product.uom?.name || "Unit",
                unitName: product.unitName ?? null,
                conversionFactor: product.conversionFactor ?? null,
                breakdownUomId: product.unitType ?? null,
            };
        });
        return map;
    });
    const userOptions = ref<{ label: string; value: string }[]>([]);

    const locationOptions = ref<{ label: string; value: string }[]>([]);
    const fromLocationOptions = ref<{ label: string; value: string }[]>([]);
    const toLocationOptions = ref<{ label: string; value: string }[]>([]);

    const opnameProfileOptions = ref<{ label: string; value: string }[]>([
        { label: "Group (Per Quartal)", value: "Group (Per Quartal)" },
        { label: "Profile (Per Bulan)", value: "Profile (Per Bulan)" },
        { label: "Tanpa Task Period", value: "Tanpa Task Period" },
    ]);

    const quartalOptions = ref<{ label: string; value: string }[]>([
        { label: "Q1 (Jan - Mar)", value: "Q1" },
        { label: "Q2 (Apr - Jun)", value: "Q2" },
        { label: "Q3 (Jul - Sep)", value: "Q3" },
        { label: "Q4 (Oct - Dec)", value: "Q4" },
    ]);

    const monthOptions = ref<{ label: string; value: string }[]>([
        { label: "January", value: "January" },
        { label: "February", value: "February" },
        { label: "March", value: "March" },
        { label: "April", value: "April" },
        { label: "May", value: "May" },
        { label: "June", value: "June" },
        { label: "July", value: "July" },
        { label: "August", value: "August" },
        { label: "September", value: "September" },
        { label: "October", value: "October" },
        { label: "November", value: "November" },
        { label: "December", value: "December" },
    ]);

    const fetchLocations = async (wId: string) => {
        try {
            const res = await locationService.list({
                warehouseId: wId,
                limit: 200,
                excludeTypes: ["product"],
            });
            const items = normalizePaginationItems(res);
            return items.map((l) => {
                const loc = l as typeof l & { name?: string };
                return {
                    label: loc.name || loc.path || String(loc.id),
                    value: String(loc.id),
                };
            });
        } catch {
            return [];
        }
    };

    const loadPutawayProducts = async (
        warehouseId: string,
        search?: string,
    ) => {
        try {
            const items =
                await transactionService.availablePutawayProducts(warehouseId);
            const normalizedSearch = search?.trim().toLowerCase();
            productOptions.value = items
                .filter((item) => {
                    if (!normalizedSearch) return true;
                    return `${item.code} ${item.name}`
                        .toLowerCase()
                        .includes(normalizedSearch);
                })
                .map((item) => {
                    const productLabel = item.code
                        ? `${item.code} - ${item.name}`
                        : item.name;
                    return {
                        label: `${productLabel} (Qty ${item.qty})`,
                        value: item.productId,
                    };
                });
        } catch {
            productOptions.value = [];
        }
    };

    const loadRelocationProducts = async (
        warehouseId: string,
        locationId: string,
        search?: string,
    ) => {
        try {
            const response = await stockService.fetchBalance({
                warehouseId,
                locationId,
                limit: 200,
            });
            const normalizedSearch = search?.trim().toLowerCase();
            productOptions.value = response.items
                .map((balance) => {
                    const record = balance as typeof balance & {
                        productCode?: string;
                        productName?: string;
                        product?: { id?: string; code?: string; name?: string };
                        quantity?: number;
                        qty?: number;
                        qty_on_hand?: number;
                    };
                    const productId = String(
                        record.product?.id ?? record.productId,
                    );
                    const code = record.product?.code ?? record.productCode;
                    const name =
                        record.product?.name ?? record.productName ?? productId;
                    const qty =
                        record.quantity ?? record.qty ?? record.qty_on_hand;
                    return {
                        label: `${code ? `${code} - ` : ""}${name} (Qty ${qty ?? 0})`,
                        value: productId,
                    };
                })
                .filter((option) =>
                    normalizedSearch
                        ? option.label.toLowerCase().includes(normalizedSearch)
                        : true,
                );
        } catch {
            productOptions.value = [];
        }
    };

    watch(
        () => form.value.warehouseId,
        async (newVal) => {
            if (!newVal) {
                locationOptions.value = [];
                return;
            }
            locationOptions.value = await fetchLocations(newVal);
            if (isPutaway.value) {
                await loadPutawayProducts(newVal);
            }
        },
    );

    watch(
        () => [form.value.fromWarehouseId, form.value.fromLocationId],
        async ([warehouseId, locationId]) => {
            if (!isRelocation.value || !warehouseId || !locationId) {
                if (isRelocation.value) productOptions.value = [];
                return;
            }
            await loadRelocationProducts(warehouseId, locationId);
        },
    );

    watch(putawayTargetLocationId, (targetLocationId) => {
        if (!isPutaway.value) return;
        form.value.lines.forEach((line) => {
            line.toLocationId = targetLocationId;
        });
    });

    watch(
        () => form.value.fromWarehouseId,
        async (newVal) => {
            if (!newVal) {
                fromLocationOptions.value = [];
                return;
            }
            fromLocationOptions.value = await fetchLocations(newVal);
        },
    );

    watch(
        () => form.value.toWarehouseId,
        async (newVal) => {
            if (!newVal) {
                toLocationOptions.value = [];
                return;
            }
            toLocationOptions.value = await fetchLocations(newVal);
        },
    );

    const addLine = () => {
        form.value.lines.push({
            productId: "",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: isPutaway.value ? putawayTargetLocationId.value : "",
            enteredUomId: "",
            enteredQty: "",
        });
    };

    const removeLine = (idx: number) => {
        form.value.lines.splice(idx, 1);
    };

    const handleBack = () => {
        router.push(`/transactions/${transactionKey}`);
    };

    const loadProducts = async (search?: string) => {
        const prodResponse = await masterService.fetchList("products", {
            limit: 200,
            search: search?.trim() || undefined,
        });
        productRecords.value = prodResponse.items;
        productOptions.value = prodResponse.items.map((p) => ({
            label: `${p.code} - ${p.name}`,
            value: String(p.id),
        }));
    };

    const searchProducts = async (search: string) => {
        try {
            if (isPutaway.value && form.value.warehouseId) {
                await loadPutawayProducts(form.value.warehouseId, search);
                return;
            }
            if (
                isRelocation.value &&
                form.value.fromWarehouseId &&
                form.value.fromLocationId
            ) {
                await loadRelocationProducts(
                    form.value.fromWarehouseId,
                    form.value.fromLocationId,
                    search,
                );
                return;
            }
            await loadProducts(search);
        } catch {
            notifyError("Gagal memuat opsi produk");
        }
    };

    const loadOptions = async () => {
        try {
            if (isRegister.value || isOutbound.value) {
                const usersResponse = await usersService.list({ limit: 200 });
                userOptions.value = usersResponse.items.map((u) => {
                    const user = u as {
                        id: string | number;
                        fullName?: string;
                    };
                    return {
                        label: String(user.fullName ?? user.id),
                        value: String(user.id),
                    };
                });
            }

            if (
                isRegister.value ||
                showSingleWarehouse.value ||
                showDualWarehouse.value
            ) {
                const whResponse = await masterService.fetchList("warehouses", {
                    limit: 100,
                });
                warehouseOptions.value = whResponse.items.map((w) => ({
                    label: `${w.code} - ${w.name}`,
                    value: String(w.id),
                }));
            }

            if (showPartnerField.value) {
                const partnerKey =
                    transactionKey === "inbound" ? "suppliers" : "customers";
                const pResponse = await masterService.fetchList(partnerKey, {
                    limit: 100,
                });
                partnerOptions.value = pResponse.items.map((p) => ({
                    label: String(p.name || p.code),
                    value: String(p.id),
                }));
            }

            if (!isPutaway.value && !isRelocation.value) {
                await loadProducts();
            }
        } catch {
            notifyError("Gagal memuat opsi form");
        }
    };

    const toDateInput = (value: unknown): string => {
        if (typeof value !== "string") return "";
        return value.split("T")[0] ?? "";
    };

    const loadExistingTransaction = async () => {
        if (!transactionId) return;
        try {
            const record = await transactionService.get(
                transactionKey,
                transactionId,
            );
            if ((record.status ?? "").toLowerCase() !== "draft") {
                notifyError("Only draft register tasks can be edited.");
                router.push(`/transactions/${transactionKey}/${transactionId}`);
                return;
            }

            form.value.docNumber = String(
                record.docNumber ?? record.docNo ?? form.value.docNumber,
            );
            form.value.transactionDate =
                toDateInput(record.docDate ?? record.date) ||
                form.value.transactionDate;
            form.value.registeredById = String(
                record.registeredById ??
                    (record.registeredBy as { id?: string } | undefined)?.id ??
                    "",
            );
            form.value.warehouseId = String(record.warehouseId ?? "");
            form.value.fromWarehouseId = String(
                record.fromWarehouseId ?? record.origin_warehouse_id ?? "",
            );
            form.value.toWarehouseId = String(
                record.toWarehouseId ?? record.destination_warehouse_id ?? "",
            );
            form.value.locationId = String(record.locationId ?? "");
            form.value.fromLocationId = String(record.fromLocationId ?? "");
            form.value.toLocationId = String(record.toLocationId ?? "");
            form.value.notes = String(record.notes ?? "");
            form.value.lines = (
                (record.lines ?? record.items ?? []) as Array<
                    Record<string, unknown>
                >
            ).map((line) => {
                const sourceLocation = line.sourceLocation as
                    | { id?: string }
                    | undefined;
                const targetLocation = line.targetLocation as
                    | { id?: string }
                    | undefined;
                const fromLocation = line.fromLocation as
                    | { id?: string }
                    | undefined;
                const toLocation = line.toLocation as
                    | { id?: string }
                    | undefined;
                const location = line.location as { id?: string } | undefined;

                const sourceLocationId = String(
                    line.sourceLocationId ??
                        line.origin_location_id ??
                        sourceLocation?.id ??
                        fromLocation?.id ??
                        "",
                );
                const targetLocationId = String(
                    line.targetLocationId ??
                        line.destination_location_id ??
                        targetLocation?.id ??
                        toLocation?.id ??
                        "",
                );

                return {
                    productId: String(
                        line.productId ??
                            (line.product as { id?: string } | undefined)?.id ??
                            "",
                    ),
                    qty: String(
                        line.qtyExpected ?? line.expectedQty ?? line.qty ?? "1",
                    ),
                    locationId: String(
                        line.locationId ??
                            location?.id ??
                            sourceLocationId ??
                            "",
                    ),
                    fromLocationId: sourceLocationId,
                    toLocationId: targetLocationId,
                    enteredUomId: String(line.enteredUomId ?? ""),
                    enteredQty: String(line.enteredQty ?? ""),
                };
            });
            if (isPutaway.value) {
                putawayTargetLocationId.value =
                    form.value.lines[0]?.toLocationId ?? "";
            }
            if (isRelocation.value) {
                form.value.fromLocationId = String(
                    record.fromLocationId ??
                        record.origin_location_id ??
                        form.value.lines[0]?.fromLocationId ??
                        "",
                );
                form.value.toLocationId = String(
                    record.toLocationId ??
                        record.destination_location_id ??
                        form.value.lines[0]?.toLocationId ??
                        "",
                );
            }
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to load transaction for editing.",
            );
        }
    };

    const handleSubmit = async () => {
        if (!isOpname.value && form.value.lines.length === 0) {
            notifyError("Please add at least one line item.");
            return;
        }

        const hasInvalidLine = form.value.lines.some((line) => {
            const qty = Number(line.qty);
            if (!line.productId || !Number.isFinite(qty) || qty <= 0) {
                return true;
            }
            if (
                (["inbound", "outbound", "return", "returns"].includes(
                    transactionKey,
                ) &&
                    !line.locationId) ||
                (isRelocation.value &&
                    (!form.value.fromWarehouseId ||
                        !form.value.fromLocationId ||
                        !form.value.toWarehouseId ||
                        !form.value.toLocationId)) ||
                (isPutaway.value && !line.toLocationId)
            ) {
                return true;
            }
            return false;
        });

        if (!isOpname.value && hasInvalidLine) {
            notifyError(
                "Please complete product, location, and quantity for every line item.",
            );
            return;
        }

        if (
            isOutbound.value &&
            (!form.value.assignedById || !form.value.deadlineAt)
        ) {
            notifyError("Please select an assigned user and deadline.");
            return;
        }

        if (
            isRegister.value &&
            (!form.value.registeredById || !form.value.warehouseId)
        ) {
            notifyError("Please select user and warehouse.");
            return;
        }

        if (
            isRelocation.value &&
            (!form.value.fromWarehouseId ||
                !form.value.fromLocationId ||
                !form.value.toWarehouseId ||
                !form.value.toLocationId)
        ) {
            notifyError("Please select source and destination warehouses.");
            return;
        }

        const cId = companyId.value;
        if (!cId) {
            notifyError(
                "No active company found. Please log in again or select a company.",
            );
            return;
        }

        submitting.value = true;
        try {
            const basePayload = {
                companyId: cId,
                docNumber: form.value.docNumber,
                notes: form.value.notes || undefined,
            };

            const docDateStr = form.value.transactionDate
                ? new Date(form.value.transactionDate).toISOString()
                : undefined;
            const deadlineAtStr = form.value.deadlineAt
                ? new Date(form.value.deadlineAt).toISOString()
                : undefined;

            let finalPayload: Record<string, unknown> = {};

            switch (transactionKey) {
                case "inbound":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        supplierId: form.value.partnerId || undefined,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            locationId: l.locationId,
                            qtyExpected: Number(l.qty),
                        })),
                    };
                    break;
                case "outbound":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        customerId: form.value.partnerId || undefined,
                        assignedById: form.value.assignedById || undefined,
                        deadlineAt: deadlineAtStr,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            locationId: l.locationId,
                            qtyExpected: Number(l.qty),
                        })),
                    };
                    break;
                case "relocation":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        fromWarehouseId: form.value.fromWarehouseId,
                        toWarehouseId: form.value.toWarehouseId,
                        fromLocationId: form.value.fromLocationId,
                        toLocationId: form.value.toLocationId,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            qty: Number(l.qty),
                        })),
                    };
                    break;
                case "return":
                case "returns":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        customerId: form.value.partnerId || undefined,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            locationId: l.locationId,
                            qty: Number(l.qty),
                        })),
                    };
                    break;
                case "opname":
                    finalPayload = {
                        ...basePayload,
                        warehouseId: form.value.warehouseId,
                        title: form.value.period
                            ? `${form.value.title} - ${form.value.period}`
                            : form.value.title || undefined,
                        taskGroup:
                            form.value.title !== "Tanpa Task Period"
                                ? form.value.title
                                : undefined,
                        taskPeriod: form.value.period || undefined,
                    };
                    break;
                case "putaway":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        warehouseId: form.value.warehouseId,
                        referenceType: form.value.referenceType || undefined,
                        referenceId: form.value.referenceId || undefined,
                        lines: form.value.lines.map((l, index) => ({
                            lineNo: index + 1,
                            productId: l.productId,
                            qty: Number(l.qty),
                            targetLocationId: l.toLocationId,
                        })),
                    };
                    break;
                case "register":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        registeredById: form.value.registeredById,
                        warehouseId: form.value.warehouseId,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            qtyExpected: Number(l.qty),
                            ...(l.enteredUomId
                                ? {
                                      enteredUomId: l.enteredUomId,
                                      enteredQty: Number(l.enteredQty),
                                  }
                                : {}),
                        })),
                    };
                    break;
            }

            if (isEditMode.value && transactionId) {
                if (!isRegister.value) {
                    delete finalPayload.companyId;
                    delete finalPayload.docNumber;
                }
                await transactionService.update(
                    transactionKey,
                    transactionId,
                    finalPayload,
                );
                notifySuccess("Transaction updated successfully");
                router.push(`/transactions/${transactionKey}/${transactionId}`);
            } else {
                await transactionService.create(transactionKey, finalPayload);
                notifySuccess("Transaction created successfully");
                router.push(`/transactions/${transactionKey}`);
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string | string[] } };
            };
            const apiMsg = errorObj?.response?.data?.message;
            let finalMsg = "Failed to create transaction.";

            if (Array.isArray(apiMsg)) {
                finalMsg = apiMsg.join(", ");
            } else if (typeof apiMsg === "string") {
                finalMsg = apiMsg;
            } else if (err instanceof Error) {
                finalMsg = err.message;
            }

            notifyError(finalMsg);
        } finally {
            submitting.value = false;
        }
    };

    return {
        form,
        submitting,
        transactionTitle,
        showSingleWarehouse,
        showDualWarehouse,
        showPartnerField,
        isRelocation,
        isOpname,
        isRegister,
        isOutbound,
        isPutaway,
        isEditMode,
        partnerLabel,
        warehouseOptions,
        partnerOptions,
        productOptions,
        productAttributeSummaries,
        productUomInfo,
        userOptions,
        locationOptions,
        fromLocationOptions,
        toLocationOptions,
        showPutawayLocations,
        putawayTargetLocationId,
        opnameProfileOptions,
        quartalOptions,
        monthOptions,
        addLine,
        removeLine,
        handleBack,
        loadOptions,
        loadExistingTransaction,
        searchProducts,
        handleSubmit,
    };
}
