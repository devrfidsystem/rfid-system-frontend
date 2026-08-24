import { ref } from "vue";
import type { Ref } from "vue";

export type ReadyRouter = {
    isReady: () => Promise<void>;
};

export const MIN_DISPLAY_MS = 1000;

export const useAppReady = (router: ReadyRouter): Ref<boolean> => {
    const appReady = ref(false);
    const startedAt = Date.now();

    const finish = () => {
        const remaining = MIN_DISPLAY_MS - (Date.now() - startedAt);
        if (remaining > 0) {
            setTimeout(() => {
                appReady.value = true;
            }, remaining);
        } else {
            appReady.value = true;
        }
    };

    router.isReady().then(finish, finish);
    return appReady;
};
