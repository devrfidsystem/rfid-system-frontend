import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { masterService } from "@/services/master.service";
import { useNotifier } from "@/composable/useNotifier";

export function useTransactionCreate(transactionKey: TransactionKey) {
    const router = useRouter();
    const { notifyError, notifySuccess } = useNotifier();
    const submitting = ref(false);

    const form = ref({
        transactionDate: new Date().toISOString().split("T")[0],
        warehouseId: "",
        partnerId: "",
        notes: "",
        lines: [] as { productId: string; qty: string }[],
    });

    const transactionTitle = computed(() => {
        const titles: Record<string, string> = {
            inbound: "Inbound",
            outbound: "Outbound",
            relocation: "Relocation",
            transfer: "Transfer",
            return: "Return",
            opname: "Stock Opname",
        };
        return titles[transactionKey] || transactionKey;
    });

    const showWarehouseField = computed(() => {
        return ["inbound", "outbound", "return", "opname"].includes(
            transactionKey,
        );
    });

    const showPartnerField = computed(() => {
        return ["inbound", "outbound", "return"].includes(transactionKey);
    });

    const partnerLabel = computed(() => {
        return transactionKey === "inbound" ? "Supplier" : "Customer";
    });

    const warehouseOptions = ref<{ label: string; value: string }[]>([]);
    const partnerOptions = ref<{ label: string; value: string }[]>([]);
    const productOptions = ref<{ label: string; value: string }[]>([]);

    const addLine = () => {
        form.value.lines.push({ productId: "", qty: "1" });
    };

    const removeLine = (idx: number) => {
        form.value.lines.splice(idx, 1);
    };

    const handleBack = () => {
        router.push(`/transactions/${transactionKey}`);
    };

    const loadOptions = async () => {
        try {
            if (showWarehouseField.value) {
                const whResponse = await masterService.fetchList(
                    "warehouses",
                    { limit: 100 },
                );
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
        if (form.value.lines.length === 0) {
            notifyError("Please add at least one line item.");
            return;
        }

        submitting.value = true;
        try {
            const payload: Record<string, unknown> = {
                transactionDate: form.value.transactionDate
                    ? new Date(form.value.transactionDate).toISOString()
                    : undefined,
                notes: form.value.notes,
                lines: form.value.lines.map((l) => ({
                    productId: l.productId,
                    expectedQty: Number(l.qty),
                    qty: Number(l.qty),
                })),
            };

            if (showWarehouseField.value) {
                payload.warehouseId = form.value.warehouseId;
            }

            if (showPartnerField.value) {
                if (transactionKey === "inbound")
                    payload.supplierId = form.value.partnerId;
                if (transactionKey === "outbound")
                    payload.customerId = form.value.partnerId;
            }

            await transactionService.create(transactionKey, payload);
            notifySuccess("Transaction created successfully");
            router.push(`/transactions/${transactionKey}`);
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to create transaction.",
            );
        } finally {
            submitting.value = false;
        }
    };

    return {
        form,
        submitting,
        transactionTitle,
        showWarehouseField,
        showPartnerField,
        partnerLabel,
        warehouseOptions,
        partnerOptions,
        productOptions,
        addLine,
        removeLine,
        handleBack,
        loadOptions,
        handleSubmit,
    };
}
