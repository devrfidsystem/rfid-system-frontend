export const SettingsSelectors = {
    HEADER: (prefix) => `[object-id='hdr_Settings${prefix}']`,
    LIST_CARD: (prefix) => `[object-id='wdg_${prefix}List']`,
    ADD_BTN: {
        Companies: "[object-id='btn_CompaniesNewCompany']",
        Apps: "[object-id='btn_AppsNewApp']",
        Menus: "[object-id='btn_MenusNewMenu']",
    },
    CODE_INPUT: (prefix) => `[object-id='txt_${prefix}FormCode']`,
    NAME_INPUT: (prefix) => `[object-id='txt_${prefix}FormName']`,
    SAVE_BTN: (prefix) => `[object-id='btn_${prefix}FormSave']`,
    MENUS_APP_SELECT: "[object-id='cmb_MenusSelectApp']",
    MENUS_EMPTY_STATE: "[object-id='stp_MenusSelectApplication']",
};
