import { createI18n } from "vue-i18n";
import commonId from "./id/common.json";
import commonEn from "./en/common.json";
import authId from "./id/auth.json";
import authEn from "./en/auth.json";

export type AppLocale = "id" | "en";

const messages = {
    id: {
        common: commonId,
        auth: authId,
    },
    en: {
        common: commonEn,
        auth: authEn,
    },
};

export const i18n = createI18n({
    legacy: false,
    locale: "id" satisfies AppLocale,
    fallbackLocale: "id" satisfies AppLocale,
    messages,
});
