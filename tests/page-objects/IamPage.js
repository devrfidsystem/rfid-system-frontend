import { By, until } from "selenium-webdriver";
import { IamSelectors } from "../selectors/iam.selectors.js";
import { navigateInApp } from "../helpers/navigation.js";

export class IamPage {
    constructor(driver, appUrl, route = "roles") {
        this.driver = driver;
        this.url = `${appUrl}/iam/${route}`;
    }

    async navigate() {
        await navigateInApp(this.driver, this.url);
        await this.driver.wait(until.urlContains(this.url), 5000);
    }

    async createRole(name) {
        const addBtn = await this.driver.wait(
            until.elementLocated(By.css(IamSelectors.ADD_ROLE_BTN)),
            10000,
        );
        await this.driver.wait(until.elementIsVisible(addBtn), 5000);
        await this.driver.wait(until.elementIsEnabled(addBtn), 5000);
        await this.driver.executeScript("arguments[0].click();", addBtn);

        const codeInput = await this.driver.wait(
            until.elementLocated(By.css(IamSelectors.ROLE_CODE_INPUT)),
            5000,
        );
        const roleCode = name.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
        await codeInput.sendKeys(roleCode);

        const nameInput = await this.driver.findElement(
            By.css(IamSelectors.ROLE_NAME_INPUT),
        );
        await nameInput.sendKeys(name);

        const saveBtn = await this.driver.wait(
            async () => {
                const buttons = await this.driver.findElements(
                    By.css(IamSelectors.SAVE_ROLE_BTN),
                );
                for (const button of buttons) {
                    try {
                        if (
                            (await button.isDisplayed()) &&
                            (await button.isEnabled())
                        ) {
                            return button;
                        }
                    } catch {
                        // Drawer can rerender while submit state changes.
                    }
                }
                return false;
            },
            10000,
            "Timed out waiting for enabled role save button.",
        );
        await this.driver.executeScript("arguments[0].click();", saveBtn);
        await this.driver.wait(async () => {
            const buttons = await this.driver.findElements(
                By.css(IamSelectors.SAVE_ROLE_BTN),
            );
            for (const button of buttons) {
                try {
                    if (await button.isDisplayed()) return false;
                } catch {
                    // Closed drawer can detach the button while polling.
                }
            }
            return true;
        }, 10000);
    }

    async verifyRolesSurface() {
        const addBtn = await this.driver.wait(
            until.elementLocated(By.css(IamSelectors.ADD_ROLE_BTN)),
            10000,
        );
        const list = await this.driver.wait(
            until.elementLocated(By.css(IamSelectors.ROLES_LIST)),
            10000,
        );
        return (await addBtn.isDisplayed()) && (await list.isDisplayed());
    }

    async verifyUserAccessSurface() {
        const header = await this.driver.wait(
            until.elementLocated(By.css(IamSelectors.USER_ACCESS_HEADER)),
            10000,
        );
        const userSelect = await this.driver.wait(
            until.elementLocated(By.css(IamSelectors.USER_ACCESS_SELECT)),
            10000,
        );
        return (await header.isDisplayed()) && (await userSelect.isDisplayed());
    }

    async waitForText(text) {
        await this.driver.wait(
            until.elementLocated(
                By.xpath(
                    `//*[@object-id='RolesList']//*[contains(normalize-space(.), '${text}')]`,
                ),
            ),
            10000,
        );
    }
}
