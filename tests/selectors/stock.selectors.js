export const StockSelectors = {
    SEARCH_INPUT: (prefix) => `[object-id='txt_${prefix}Search']`,
    FILTER_BTN: (prefix) => `[object-id='btn_${prefix}Filter']`,
    WAREHOUSE_FILTER: (prefix) => `[object-id='cmb_${prefix}Warehouse']`,
    EXPORT_BTN: (prefix) => `[object-id='btn_${prefix}Export']`,
    TABLE_ROWS: "[object-id^='tbl_StockRow_']",
    VIEW_DETAILS_BTN: "[object-id^='btn_StockViewDetails_']",
};
