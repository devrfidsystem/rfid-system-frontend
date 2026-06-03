import type { Ref } from "vue";
import {
    useNotificationStore,
    type ToastVariant,
} from "@/store/notification.store";

export type NotifyVariant = ToastVariant;

export interface NotifyOptions {
    duration?: number;
    variant?: NotifyVariant;
    silent?: boolean;
}

export interface WithToastOptions {
    loadingRef?: Ref<boolean>;
    successMessage?: string;
    errorMessage?: string;
    successVariant?: NotifyVariant;
    errorVariant?: NotifyVariant;
    successOptions?: NotifyOptions;
    errorOptions?: NotifyOptions;
}

const normalizeMessage = (value: unknown): string => {
    if (!value) return "Operasi selesai.";
    if (value instanceof Error) {
        return value.message;
    }
    if (typeof value === "string") {
        return value;
    }
    return "Terjadi kesalahan saat memproses permintaan.";
};

export function useNotifier() {
    const store = useNotificationStore();

    const notify = (message: string, opts?: NotifyOptions) => {
        if (!message) return;
        if (opts?.silent) return;
        store.notify(message, {
            variant: opts?.variant,
            duration: opts?.duration,
        });
    };

    const notifySuccess = (message: string, opts?: NotifyOptions) =>
        notify(message, { ...opts, variant: opts?.variant ?? "success" });
    const notifyError = (message: string, opts?: NotifyOptions) =>
        notify(message, { ...opts, variant: opts?.variant ?? "error" });
    const notifyWarning = (message: string, opts?: NotifyOptions) =>
        notify(message, { ...opts, variant: opts?.variant ?? "warning" });
    const notifyNeutral = (message: string, opts?: NotifyOptions) =>
        notify(message, { ...opts, variant: opts?.variant ?? "neutral" });

    const withToast = async <T>(
        action: () => Promise<T>,
        options: WithToastOptions = {},
    ): Promise<T> => {
        const {
            loadingRef,
            successMessage,
            errorMessage,
            successVariant = "success",
            errorVariant = "error",
            successOptions,
            errorOptions,
        } = options;

        if (loadingRef) {
            loadingRef.value = true;
        }

        try {
            const result = await action();
            if (successMessage) {
                notifySuccess(successMessage, {
                    ...successOptions,
                    variant: successVariant,
                });
            }
            return result;
        } catch (error) {
            const message = errorMessage ?? normalizeMessage(error);
            notifyError(message, { ...errorOptions, variant: errorVariant });
            throw error;
        } finally {
            if (loadingRef) {
                loadingRef.value = false;
            }
        }
    };

    return {
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyNeutral,
        withToast,
    };
}
