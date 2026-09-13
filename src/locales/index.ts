import { createI18n } from "vue-i18n";
import commonId from "./id/common.json";
import commonEn from "./en/common.json";
import authId from "./id/auth.json";
import authEn from "./en/auth.json";
import dashboardId from "./id/dashboard.json";
import dashboardEn from "./en/dashboard.json";

export type AppLocale = "id" | "en";

const messages = {
    id: {
        common: commonId,
        auth: authId,
        dashboard: dashboardId,
    },
    en: {
        common: commonEn,
        auth: authEn,
        dashboard: dashboardEn,
    },
};

export const i18n = createI18n({
    legacy: false,
    locale: "id" satisfies AppLocale,
    fallbackLocale: "id" satisfies AppLocale,
    messages,
});
