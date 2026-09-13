import { defineStore } from "pinia";
import { i18n, type AppLocale } from "@/locales";

const STORAGE_KEY = "rfid-locale";
const SUPPORTED_LOCALES: AppLocale[] = ["id", "en"];

const isAppLocale = (value: string | null): value is AppLocale =>
    value !== null && (SUPPORTED_LOCALES as string[]).includes(value);

const getStoredLocale = (): AppLocale => {
    if (typeof window === "undefined") return "id";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isAppLocale(stored) ? stored : "id";
};

export const useLocaleStore = defineStore("locale", {
    state: () => ({
        locale: "id" as AppLocale,
        initialized: false,
    }),
    actions: {
        initialize() {
            if (this.initialized) return;
            this.locale = getStoredLocale();
            if (typeof document !== "undefined") {
                document.documentElement.lang = this.locale;
            }
            i18n.global.locale.value = this.locale;
            this.initialized = true;
        },
        setLocale(locale: AppLocale) {
            this.locale = locale;
            if (typeof document !== "undefined") {
                document.documentElement.lang = locale;
            }
            i18n.global.locale.value = locale;
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_KEY, locale);
            }
        },
    },
});
