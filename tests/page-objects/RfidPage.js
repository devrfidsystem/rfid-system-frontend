import { By, until } from "selenium-webdriver";
import { RfidSelectors } from "../selectors/rfid.selectors.js";
import { navigateInApp } from "../helpers/navigation.js";

export class RfidPage {
    constructor(driver, appUrl, route = "tags") {
        this.driver = driver;
        this.url = `${appUrl}/rfid/${route}`;
    }

    async navigate() {
        await navigateInApp(this.driver, this.url);
    }

    async isAccessible() {
        return (await this.driver.getCurrentUrl()) === this.url;
    }

    async registerTag(epc, sku) {
        const epcInput = await this.driver.findElement(
            By.css(RfidSelectors.TAG_EPC_INPUT),
        );
        await epcInput.sendKeys(epc);

        const productSelect = await this.driver.findElement(
            By.css(RfidSelectors.PRODUCT_SELECT),
        );
        await productSelect.sendKeys(sku);

        const saveBtn = await this.driver.findElement(
            By.css(RfidSelectors.SAVE_BTN),
        );
        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async verifyRegistrationSurface() {
        const createCard = await this.driver.wait(
            until.elementLocated(By.css(RfidSelectors.CREATE_CARD)),
            10000,
        );
        const listCard = await this.driver.wait(
            until.elementLocated(By.css(RfidSelectors.LIST_CARD)),
            10000,
        );
        const epcInput = await this.driver.findElement(
            By.css(RfidSelectors.TAG_EPC_INPUT),
        );
        const productSelect = await this.driver.findElement(
            By.css(RfidSelectors.PRODUCT_SELECT),
        );
        const refreshBtn = await this.driver.findElement(
            By.css(RfidSelectors.REFRESH_BTN),
        );
        return (
            (await createCard.isDisplayed()) &&
            (await listCard.isDisplayed()) &&
            (await epcInput.isDisplayed()) &&
            (await productSelect.isDisplayed()) &&
            (await refreshBtn.isDisplayed())
        );
    }
}
