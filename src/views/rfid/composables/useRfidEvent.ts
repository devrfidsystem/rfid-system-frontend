import { ref, computed } from "vue";
import { z } from "zod";
import { useNotifier } from "@/composable/useNotifier";
import { useZodForm } from "@/composable/useZodForm";
import { rfidService } from "@/services/rfid.service";
import { parseApiError } from "@/lib/api/parseApiError";
import type { LogEpcEventDto } from "@/api/feature/dto/rfid.dto";

export function useRfidEvent() {
    const eventTypes = [
        "read",
        "encode",
        "assign",
        "unassign",
        "status_change",
    ];

    const eventTypeOptions = computed(() =>
        eventTypes.map((type) => ({
            label: type.replace("_", " "),
            value: type,
        })),
    );

    const schema = z.object({
        epcCode: z.string().min(1, "EPC Code is required"),
        eventType: z.string().min(1, "Event Type is required"),
        warehouseId: z.string().optional(),
        locationId: z.string().optional(),
        documentRef: z.string().optional(),
        notes: z.string().optional(),
    });

    const form = useZodForm(schema, {
        epcCode: "",
        eventType: "",
        warehouseId: "",
        locationId: "",
        documentRef: "",
        notes: "",
    });

    const isSubmitting = ref(false);
    const submitError = ref<string | null>(null);

    const { withToast } = useNotifier();

    const resetFormState = () => {
        form.resetForm();
        submitError.value = null;
    };

    const submitEvent = form.handleSubmit(async (values) => {
        submitError.value = null;
        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    const searchResp = await rfidService.listTags({
                        search: values.epcCode,
                        limit: 1,
                    });
                    const tag =
                        searchResp.items && searchResp.items.length
                            ? searchResp.items[0]
                            : null;
                    if (!tag) {
                        throw new Error(
                            "Tag dengan EPC code ini tidak ditemukan",
                        );
                    }

                    const eventPayload = {
                        ...(values.warehouseId
                            ? { warehouseId: values.warehouseId }
                            : {}),
                        ...(values.locationId
                            ? { locationId: values.locationId }
                            : {}),
                        ...(values.documentRef
                            ? { documentRef: values.documentRef }
                            : {}),
                        ...(values.notes ? { notes: values.notes } : {}),
                    };

                    const payload: LogEpcEventDto = {
                        epcTagId: tag.id,
                        eventType: values.eventType,
                        payload: Object.keys(eventPayload).length
                            ? eventPayload
                            : undefined,
                    };

                    await rfidService.logEvent(payload);
                    resetFormState();
                },
                {
                    successMessage: "Event logged",
                    errorMessage: "Fail to log event",
                },
            );
        } catch (err) {
            try {
                const parsed = parseApiError(err as unknown);
                if (parsed.fieldErrors) {
                    form.setErrors(parsed.fieldErrors);
                }
                submitError.value =
                    parsed.message ??
                    (err instanceof Error
                        ? err.message
                        : "Unable to log event.");
            } catch {
                submitError.value =
                    err instanceof Error ? err.message : "Unable to log event.";
            }
        } finally {
            isSubmitting.value = false;
        }
    });

    return {
        eventTypeOptions,
        isSubmitting,
        submitError,
        resetFormState,
        submitEvent,
    };
}
