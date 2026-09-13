import { By, until } from "selenium-webdriver";
import { SettingsSelectors } from "../selectors/settings.selectors.js";
import { navigateInApp } from "../helpers/navigation.js";

export class SettingsPage {
    constructor(driver, appUrl, route = "companies") {
        this.driver = driver;
        this.prefix =
            route === "apps"
                ? "Apps"
                : route === "menus"
                  ? "Menus"
                  : "Companies";
        this.url = `${appUrl}/settings/${route}`;
    }

    async navigate() {
        await navigateInApp(this.driver, this.url);
    }

    async verifySurface() {
        const header = await this.driver.wait(
            until.elementLocated(By.css(SettingsSelectors.HEADER(this.prefix))),
            10000,
        );
        const listCard = await this.driver.wait(
            until.elementLocated(
                By.css(SettingsSelectors.LIST_CARD(this.prefix)),
            ),
            10000,
        );
        return (await header.isDisplayed()) && (await listCard.isDisplayed());
    }

    async openCreateForm() {
        const selector = SettingsSelectors.ADD_BTN[this.prefix];
        const addBtn = await this.driver.wait(
            until.elementLocated(By.css(selector)),
            10000,
        );
        await addBtn.click();
        await this.driver.sleep(1000);
    }

    async verifyCreateForm() {
        if (this.prefix === "Menus") {
            const appSelect = await this.driver.wait(
                until.elementLocated(
                    By.css(SettingsSelectors.MENUS_APP_SELECT),
                ),
                10000,
            );
            const emptyState = await this.driver.findElements(
                By.css(SettingsSelectors.MENUS_EMPTY_STATE),
            );
            const addButtons = await this.driver.findElements(
                By.css(SettingsSelectors.ADD_BTN.Menus),
            );
            return (
                (await appSelect.isDisplayed()) &&
                (emptyState.length > 0 || addButtons.length > 0)
            );
        }

        await this.openCreateForm();
        const codeInput = await this.driver.findElement(
            By.css(SettingsSelectors.CODE_INPUT(this.prefix)),
        );
        const nameInput = await this.driver.findElement(
            By.css(SettingsSelectors.NAME_INPUT(this.prefix)),
        );
        const saveBtn = await this.driver.findElement(
            By.css(SettingsSelectors.SAVE_BTN(this.prefix)),
        );
        return (
            (await codeInput.isDisplayed()) &&
            (await nameInput.isDisplayed()) &&
            (await saveBtn.isDisplayed())
        );
    }
}
