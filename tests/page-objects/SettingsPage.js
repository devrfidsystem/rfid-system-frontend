import { By, until } from "selenium-webdriver";
import { SettingsSelectors } from "../selectors/settings.selectors.js";

export class SettingsPage {
    constructor(driver, appUrl, route = "companies") {
        this.driver = driver;
        this.url = `${appUrl}/settings/${route}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async createItem(name, type = "companies") {
        const addBtn = await this.driver.findElement(
            By.css(SettingsSelectors.ADD_BTN),
        );
        await addBtn.click();
        await this.driver.sleep(1000);

        if (type === "companies") {
            const nameInput = await this.driver.findElement(
                By.css(SettingsSelectors.COMPANY_NAME_INPUT),
            );
            await nameInput.sendKeys(name);
        } else if (type === "apps") {
            const appInput = await this.driver.findElement(
                By.css(SettingsSelectors.APP_NAME_INPUT),
            );
            await appInput.sendKeys(name);
        }

        const saveBtn = await this.driver.findElement(
            By.css(SettingsSelectors.SAVE_BTN),
        );
        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async search(text) {
        const searchInput = await this.driver.findElement(
            By.css(SettingsSelectors.SEARCH_INPUT),
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }
}
