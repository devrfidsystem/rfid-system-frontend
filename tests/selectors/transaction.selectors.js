export const TransactionSelectors = {
    NEW_BTN: "[object-id='btn_TransactionHeaderNew']",
    DOC_NO_INPUT: "[object-id='txt_TransactionCreateDocNumber']",
    CUSTOMER_CMB: "[object-id='cmb_TransactionCreatePartner']",
    ADD_LINE_BTN: "[object-id='btn_TransactionLineItemsAdd']",
    NOTES_INPUT: "[object-id='txt_TransactionCreateNotes']",
    SAVE_BTN: "[object-id='btn_TransactionLineItemsSave']",

    // Added selectors
    SEARCH_INPUT: "[object-id='txt_TransactionHeaderSearch']",
    STATUS_FILTER: "[object-id='btn_TransactionHeaderFilter']", // The filter button, then we can click it and maybe select something
    TABLE_ROWS: "[object-id^='tbl_TransactionRow_']",
    TAB_INBOUND: "[object-id='tab_TransactionInbound']",
    TAB_OUTBOUND: "[object-id='tab_TransactionOutbound']",

    // Additional Selectors for Standard compliance
    EMPTY_STATE: "img[alt*='kosong']",
    PAGINATION_NEXT: "//button[contains(text(), 'Next')]",
    PAGINATION_PREV: "//button[contains(text(), 'Prev')]",
    ERROR_TEXT: ".text-signal-red",
    TOAST_SUCCESS: "[id^='msb_Toast_'].border-emerald-100",
    TOAST_ERROR: "[id^='msb_Toast_'].border-red-100",
    ROW_ACTIONS: "button[title='View Details']", // Depending on implementation
    MODAL_DELETE: ".dialog-content", // Dialog Box confirmation
    CONFIRM_DELETE_BTN: "[data-testid='button-handleconfirm']",
};
