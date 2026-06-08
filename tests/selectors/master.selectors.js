export const MasterSelectors = {
    ADD_BTN: "[object-id='btn_MasterAdd']",

    // Dynamic Form Selectors based on field.key and field.type
    INPUT_TEXT: (key) => `[object-id='txt_MasterForm_Field${key}']`,
    INPUT_TEXTAREA: (key) => `[object-id='txa_MasterForm_Field${key}']`,
    INPUT_SELECT: (key) => `[object-id='cmb_MasterForm_Field${key}']`,

    SAVE_BTN: "[object-id='btn_MasterFormSave']",
    SEARCH_INPUT: "[object-id='txt_MasterSearch']",
    TABLE_ROWS: "[object-id^='tbl_MasterRow_']",
    EDIT_BTN_PREFIX: "[object-id^='btn_MasterEdit_']",
    DELETE_BTN_PREFIX: "[object-id^='btn_MasterDelete_']",
    CONFIRM_DELETE_BTN: "[object-id='btn_ConfirmDelete']",
    TOAST_MESSAGE: "[object-id='msb_GlobalToastSuccess']",
};
