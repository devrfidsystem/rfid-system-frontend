import { By, until } from "selenium-webdriver";
import { RfidSelectors } from "../selectors/rfid.selectors.js";

export class RfidPage {
    constructor(driver, appUrl, route = "tags") {
        this.driver = driver;
        this.url = `${appUrl}/rfid/${route}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async registerTag(epc, sku) {
        const addBtn = await this.driver.findElement(
            By.css(RfidSelectors.REGISTER_TAG_BTN),
        );
        await addBtn.click();
        await this.driver.sleep(1000);

        const epcInput = await this.driver.findElement(
            By.css(RfidSelectors.TAG_EPC_INPUT),
        );
        await epcInput.sendKeys(epc);

        const skuInput = await this.driver.findElement(
            By.css(RfidSelectors.ITEM_SKU_INPUT),
        );
        await skuInput.sendKeys(sku);

        const saveBtn = await this.driver.findElement(
            By.css(RfidSelectors.SAVE_BTN),
        );
        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async search(text) {
        const searchInput = await this.driver.findElement(
            By.css(RfidSelectors.SEARCH_INPUT),
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }
}
