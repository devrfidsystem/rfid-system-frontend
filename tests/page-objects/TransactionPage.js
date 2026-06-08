/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
import { By, until } from "selenium-webdriver";
import { TransactionSelectors } from "../selectors/transaction.selectors.js";

export class TransactionPage {
    constructor(driver, appUrl, type = "inbound") {
        this.driver = driver;
        this.type = type;
        this.url = `${appUrl}/transactions/${type}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async switchTab(targetType) {
        if (targetType === "outbound") {
            const tab = await this.driver.findElement(
                By.css(TransactionSelectors.TAB_OUTBOUND),
            );
            await tab.click();
        } else {
            const tab = await this.driver.findElement(
                By.css(TransactionSelectors.TAB_INBOUND),
            );
            await tab.click();
        }
        await this.driver.sleep(1000);
    }

    async clickNew() {
        try {
            const newBtn = await this.driver.wait(
                until.elementLocated(By.css(TransactionSelectors.NEW_BTN)),
                5000,
            );
            await this.driver.sleep(1000);
            await newBtn.click();
            await this.driver.wait(until.urlContains("/new"), 5000);
        } catch (e) {
            console.log(
                "clickNew failed, maybe already on new page or not rendered",
                e.message,
            );
        }
    }

    async fillDocNumber(docNo) {
        const docNumber = await this.driver.wait(
            until.elementLocated(By.css(TransactionSelectors.DOC_NO_INPUT)),
            5000,
        );
        await docNumber.sendKeys(docNo);
    }

    async addLineItem() {
        const addLineBtn = await this.driver.findElement(
            By.css(TransactionSelectors.ADD_LINE_BTN),
        );
        await addLineBtn.click();
        await this.driver.sleep(500);
    }

    async fillDate(dateStr) {
        try {
            const dateInput = await this.driver.findElement(
                By.css("[object-id='dtp_TransactionCreateDate']"),
            );
            await this.driver.executeScript(
                "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true })); arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
                dateInput,
                dateStr,
            );
        } catch (e) {
            // Might not exist for Opname
        }
    }

    async fillNotes(notes) {
        const notesInput = await this.driver.findElement(
            By.css(TransactionSelectors.NOTES_INPUT),
        );
        await notesInput.clear();
        await notesInput.sendKeys(notes);
    }

    async selectFirstValidOption(objectId) {
        try {
            const selectElement = await this.driver.wait(
                until.elementLocated(By.css(`[object-id='${objectId}']`)),
                5000,
            );
            const options = await selectElement.findElements(
                By.css("option:not([disabled])"),
            );
            for (let opt of options) {
                const val = await opt.getAttribute("value");
                if (val && val.trim() !== "") {
                    await this.driver.executeScript(
                        `
                        arguments[0].value = arguments[1];
                        arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                        arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                    `,
                        selectElement,
                        val,
                    );

                    // Sleep to allow dependent dropdowns (like Locations based on Warehouse) to load
                    await this.driver.sleep(1000);
                    break;
                }
            }
        } catch (e) {
            console.log(`Dropdown not found or empty: ${objectId}`);
        }
    }

    async submit(type) {
        const selector =
            type === "opname"
                ? "[object-id='btn_TransactionCreateOpnameSubmit']"
                : TransactionSelectors.SAVE_BTN;
        const saveBtn = await this.driver.wait(
            until.elementLocated(By.css(selector)),
            5000,
        );
        // Wait until clickable
        await this.driver.wait(until.elementIsVisible(saveBtn), 5000);
        await this.driver.wait(until.elementIsEnabled(saveBtn), 5000);

        // Disable native HTML5 validation so Vue's handleSubmit definitely fires
        await this.driver.executeScript(
            "const form = document.querySelector('form'); if(form) form.noValidate = true;",
        );

        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async searchTransaction(text) {
        const searchInput = await this.driver.wait(
            until.elementLocated(By.css(TransactionSelectors.SEARCH_INPUT)),
            5000,
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }

    async toggleFilter() {
        const statusFilter = await this.driver.wait(
            until.elementLocated(By.css(TransactionSelectors.STATUS_FILTER)),
            5000,
        );
        await statusFilter.click();
        await this.driver.sleep(1500);
    }

    async getTableRows() {
        return await this.driver.findElements(
            By.css(TransactionSelectors.TABLE_ROWS),
        );
    }

    async verifyEmptyState() {
        const emptyState = await this.driver.wait(
            until.elementLocated(By.css(TransactionSelectors.EMPTY_STATE)),
            10000,
        );
        return await emptyState.isDisplayed();
    }

    async clickNextPage() {
        const nextBtn = await this.driver.findElement(
            By.xpath(TransactionSelectors.PAGINATION_NEXT),
        );
        await nextBtn.click();
        await this.driver.sleep(1500);
    }

    async clickPrevPage() {
        const prevBtn = await this.driver.findElement(
            By.xpath(TransactionSelectors.PAGINATION_PREV),
        );
        await prevBtn.click();
        await this.driver.sleep(1500);
    }

    async getValidationErrors() {
        const errors = await this.driver.findElements(
            By.css(TransactionSelectors.ERROR_TEXT),
        );
        return errors;
    }

    async sortByColumn(columnText) {
        const header = await this.driver.findElement(
            By.xpath(`//th[contains(., '${columnText}')]`),
        );
        await header.click();
        await this.driver.sleep(1500);
    }

    async waitForToastResult() {
        const anyToastSelector = "[id^='msb_Toast_']";
        const toast = await this.driver.wait(
            until.elementLocated(By.css(anyToastSelector)),
            5000,
        );
        const className = await toast.getAttribute("class");
        const text = await toast.getText();
        if (
            className.includes("emerald") ||
            className.includes("green") ||
            className.includes("success")
        ) {
            // It's a success toast
            return true;
        } else {
            // It's an error toast
            throw new Error(`Backend Error Toast: ${text}`);
        }
    }

    async clickFirstRowAction() {
        const actionBtn = await this.driver.wait(
            until.elementLocated(By.css(TransactionSelectors.ROW_ACTIONS)),
            5000,
        );
        await actionBtn.click();
        await this.driver.sleep(1000);
    }

    async confirmDelete() {
        const confirmBtn = await this.driver.wait(
            until.elementLocated(
                By.css(TransactionSelectors.CONFIRM_DELETE_BTN),
            ),
            5000,
        );
        await confirmBtn.click();
        await this.driver.sleep(1000);
    }
}
