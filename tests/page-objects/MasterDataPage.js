/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
import { By, until } from "selenium-webdriver";
import { MasterSelectors } from "../selectors/master.selectors.js";

export class MasterDataPage {
    constructor(driver, appUrl, entityRoute) {
        this.driver = driver;
        this.url = `${appUrl}/master-data/${entityRoute ?? "products"}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async openCreateForm() {
        const newBtn = await this.driver.wait(
            until.elementLocated(By.css(MasterSelectors.ADD_BTN)),
            5000,
        );
        await newBtn.click();
        await this.driver.sleep(1000);
    }

    async fillForm(fieldsMap) {
        for (const [key, fieldConfig] of Object.entries(fieldsMap)) {
            let selector;
            if (fieldConfig.type === "textarea") {
                selector = MasterSelectors.INPUT_TEXTAREA(key);
            } else if (fieldConfig.type === "select") {
                selector = MasterSelectors.INPUT_SELECT(key);
            } else {
                selector = MasterSelectors.INPUT_TEXT(key);
            }

            try {
                const element = await this.driver.wait(
                    until.elementLocated(By.css(selector)),
                    3000,
                );

                if (fieldConfig.type === "select") {
                    // Primitive support for native select testing
                    await element.click();
                    await element.sendKeys(fieldConfig.value);
                    // Add delay to let UI register select update
                    await this.driver.sleep(500);
                } else {
                    await element.clear();
                    await element.sendKeys(fieldConfig.value);
                }
            } catch (err) {
                console.warn(
                    `    -> [Warning] Failed to fill field ${key}. It might be read-only or hidden.`,
                );
            }
        }
    }

    async selectFirstOption(fieldKey) {
        const selector = MasterSelectors.INPUT_SELECT(fieldKey);
        const trigger = await this.driver.wait(
            until.elementLocated(By.css(selector)),
            5000,
        );
        await trigger.click();

        const optionButton = await this.driver.wait(
            until.elementLocated(
                By.xpath(
                    `//*[contains(@object-id, 'cmb_MasterForm_Field${fieldKey}')]/ancestor::div[contains(@class,'relative')][1]//li[1]//button`,
                ),
            ),
            5000,
        );
        await optionButton.click();
        await this.driver.sleep(300);
    }

    async submitForm() {
        const saveBtn = await this.driver.findElement(
            By.css(MasterSelectors.SAVE_BTN),
        );
        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async waitForTableText(text) {
        await this.driver.wait(
            until.elementLocated(
                By.xpath(`//*[contains(normalize-space(.), '${text}')]`),
            ),
            10000,
        );
    }

    async search(text) {
        const searchInput = await this.driver.findElement(
            By.css(MasterSelectors.SEARCH_INPUT),
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500); // Wait for debounce
    }

    async fillProductCode(value) {
        await this.fillForm({ code: { value, type: "text" } });
    }

    async fillProductName(value) {
        await this.fillForm({ name: { value, type: "text" } });
    }

    async searchProduct(text) {
        await this.search(text);
        await this.waitForTableText(text);
    }

    async editFirstProduct() {
        await this.editFirstItem();
    }

    async deleteFirstProduct() {
        await this.deleteFirstItem();
    }

    async editFirstItem() {
        const editBtn = await this.driver.wait(
            until.elementLocated(By.css(MasterSelectors.EDIT_BTN_PREFIX)),
            10000,
        );
        await editBtn.click();
        await this.driver.sleep(1000);
    }

    async deleteFirstItem() {
        const deleteBtn = await this.driver.wait(
            until.elementLocated(By.css(MasterSelectors.DELETE_BTN_PREFIX)),
            10000,
        );
        await deleteBtn.click();
        await this.driver.sleep(1000);

        const confirmBtn = await this.driver.wait(
            until.elementLocated(By.css(MasterSelectors.CONFIRM_DELETE_BTN)),
            5000,
        );
        await confirmBtn.click();
        await this.driver.sleep(1500);
    }
}
