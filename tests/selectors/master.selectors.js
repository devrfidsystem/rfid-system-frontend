export const MasterSelectors = {
    ADD_BTN: "[object-id='btn_MasterHeaderAdd']",

    // Dynamic Form Selectors based on field.key and field.type
    INPUT_TEXT: (key) => `[object-id='txt_MasterForm_Field${key}']`,
    INPUT_TEXTAREA: (key) => `[object-id='txa_MasterForm_Field${key}']`,
    INPUT_SELECT: (key) => `[object-id='cmb_MasterForm_Field${key}']`,

    SAVE_BTN: "[object-id='btn_MasterFormSave']",
    SEARCH_INPUT: "[object-id='txt_MasterHeaderSearch']",
    TABLE_ROWS: "[object-id^='tbl_MasterRow_']",
    EDIT_BTN_PREFIX: "[object-id='btn_MasterTableEdit']",
    DELETE_BTN_PREFIX: "[object-id='btn_MasterTableDelete']",
    CONFIRM_DELETE_BTN: "[object-id='btn_MasterDeleteConfirm']",
    TOAST_MESSAGE: "[object-id='msb_GlobalToastSuccess']",
};
