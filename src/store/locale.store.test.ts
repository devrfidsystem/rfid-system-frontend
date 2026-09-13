if (typeof window === "undefined") {
    (globalThis as { window?: unknown }).window = {
        localStorage: (() => {
            const store = new Map<string, string>();
            return {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => {
                    store.set(key, value);
                },
                clear: () => store.clear(),
            };
        })(),
    };
}

import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocaleStore } from "./locale.store";
import { i18n } from "@/locales";

describe("useLocaleStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        window.localStorage.clear();
        i18n.global.locale.value = "id";
    });

    it("defaults to Indonesian when nothing is stored", () => {
        const store = useLocaleStore();
        store.initialize();

        expect(store.locale).toBe("id");
        expect(i18n.global.locale.value).toBe("id");
    });

    it("restores a previously stored locale", () => {
        window.localStorage.setItem("rfid-locale", "en");
        const store = useLocaleStore();
        store.initialize();

        expect(store.locale).toBe("en");
        expect(i18n.global.locale.value).toBe("en");
    });

    it("updates the store, i18n instance, and localStorage on setLocale", () => {
        const store = useLocaleStore();
        store.initialize();

        store.setLocale("en");

        expect(store.locale).toBe("en");
        expect(i18n.global.locale.value).toBe("en");
        expect(window.localStorage.getItem("rfid-locale")).toBe("en");
    });

    it("ignores an invalid stored value and falls back to Indonesian", () => {
        window.localStorage.setItem("rfid-locale", "fr");
        const store = useLocaleStore();
        store.initialize();

        expect(store.locale).toBe("id");
    });
});
