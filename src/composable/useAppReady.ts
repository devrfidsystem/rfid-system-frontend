import { ref } from "vue";
import type { Ref } from "vue";

export type ReadyRouter = {
    isReady: () => Promise<void>;
};

export const useAppReady = (router: ReadyRouter): Ref<boolean> => {
    const appReady = ref(false);
    router.isReady().then(
        () => {
            appReady.value = true;
        },
        () => {
            appReady.value = true;
        },
    );
    return appReady;
};
