/* eslint-disable no-console */
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { masterService } from "@/services/master.service";
import { usersService } from "@/services/users.service";
import { locationService } from "@/services/location.service";
import { useNotifier } from "@/composable/useNotifier";
import { useAuthStore } from "@/store/auth.store";
import { normalizePaginationItems } from "@/lib/api/normalizers";

export function useTransactionCreate(transactionKey: TransactionKey) {
    const router = useRouter();
    const { notifyError, notifySuccess } = useNotifier();
    const authStore = useAuthStore();
    const submitting = ref(false);

    const companyId = computed(() => authStore.currentCompanyId);

    const form = ref({
        docNumber: `TRX-${Date.now()}`,
        transactionDate: new Date().toISOString().split("T")[0],
        title: "",
        period: "",
        warehouseId: "",
        fromWarehouseId: "",
        toWarehouseId: "",
        partnerId: "",
        registeredById: "",
        notes: "",
        lines: [] as {
            productId: string;
            qty: string;
            locationId: string;
            fromLocationId: string;
            toLocationId: string;
        }[],
    });

    const transactionTitle = computed(() => {
        const titles: Record<string, string> = {
            register: "Register",
            inbound: "Inbound",
            outbound: "Outbound",
            relocation: "Relocation",
            transfer: "Transfer",
            return: "Return",
            returns: "Return",
            opname: "Stock Opname",
        };
        return titles[transactionKey] || transactionKey;
    });

    const isTransfer = computed(() => transactionKey === "transfer");
    const isRelocation = computed(() => transactionKey === "relocation");
    const isOpname = computed(() => transactionKey === "opname");
    const isRegister = computed(() => transactionKey === "register");

    const showSingleWarehouse = computed(() =>
        [
            "inbound",
            "outbound",
            "return",
            "returns",
            "opname",
            "relocation",
        ].includes(transactionKey),
    );
    const showDualWarehouse = computed(() => isTransfer.value);

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

    watch(
        () => form.value.warehouseId,
        async (newVal) => {
            if (!newVal) {
                locationOptions.value = [];
                return;
            }
            locationOptions.value = await fetchLocations(newVal);
        },
    );

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
            toLocationId: "",
        });
    };

    const removeLine = (idx: number) => {
        form.value.lines.splice(idx, 1);
    };

    const handleBack = () => {
        router.push(`/transactions/${transactionKey}`);
    };

    const loadOptions = async () => {
        try {
            if (isRegister.value) {
                const usersResponse = await usersService.list({ limit: 200 });
                userOptions.value = usersResponse.items.map((u) => {
                    const user = u as { id: string | number; fullName?: string };
                    return {
                        label: String(user.fullName ?? user.id),
                        value: String(user.id),
                    };
                });
                return;
            }

            if (showSingleWarehouse.value || showDualWarehouse.value) {
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

            const prodResponse = await masterService.fetchList("products", {
                limit: 200,
            });
            productOptions.value = prodResponse.items.map((p) => ({
                label: `${p.code} - ${p.name}`,
                value: String(p.id),
            }));
        } catch (err) {
            console.error("Failed to load options", err);
            notifyError("Gagal memuat opsi form");
        }
    };

    const handleSubmit = async () => {
        if (
            !isOpname.value &&
            !isRegister.value &&
            form.value.lines.length === 0
        ) {
            notifyError("Please add at least one line item.");
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
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            fromLocationId: l.fromLocationId,
                            toLocationId: l.toLocationId,
                            qty: Number(l.qty),
                        })),
                    };
                    break;
                case "transfer":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        fromWarehouseId: form.value.fromWarehouseId,
                        toWarehouseId: form.value.toWarehouseId,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            fromLocationId: l.fromLocationId,
                            toLocationId: l.toLocationId,
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
                case "register":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        registeredById: form.value.registeredById,
                    };
                    break;
            }

            await transactionService.create(transactionKey, finalPayload);
            notifySuccess("Transaction created successfully");
            router.push(`/transactions/${transactionKey}`);
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
        isTransfer,
        isRelocation,
        isOpname,
        isRegister,
        partnerLabel,
        warehouseOptions,
        partnerOptions,
        productOptions,
        userOptions,
        locationOptions,
        fromLocationOptions,
        toLocationOptions,
        opnameProfileOptions,
        quartalOptions,
        monthOptions,
        addLine,
        removeLine,
        handleBack,
        loadOptions,
        handleSubmit,
    };
}
