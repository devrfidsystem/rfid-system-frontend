import { ref } from "vue";
import { rfidService, type AssignEpcPayload } from "@/services/rfid.service";

export function useEpcAssignment() {
    const assigning = ref(false);
    const error = ref<string | null>(null);

    const assignToProduct = async (payload: AssignEpcPayload) => {
        assigning.value = true;
        error.value = null;
        try {
            const tag = await rfidService.assignTag(payload);
            return tag;
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message;
            } else if (typeof err === "string") {
                error.value = err;
            } else {
                error.value = "Failed to assign EPC tag";
            }
            throw err;
        } finally {
            assigning.value = false;
        }
    };

    return {
        assigning,
        error,
        assignToProduct,
    };
}
