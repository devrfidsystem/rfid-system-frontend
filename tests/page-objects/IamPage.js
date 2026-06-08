import { By, until } from "selenium-webdriver";
import { IamSelectors } from "../selectors/iam.selectors.js";

export class IamPage {
    constructor(driver, appUrl, route = "roles") {
        this.driver = driver;
        this.url = `${appUrl}/iam/${route}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async createRole(name) {
        const addBtn = await this.driver.findElement(
            By.css(IamSelectors.ADD_ROLE_BTN),
        );
        await addBtn.click();
        await this.driver.sleep(1000);

        const nameInput = await this.driver.findElement(
            By.css(IamSelectors.ROLE_NAME_INPUT),
        );
        await nameInput.sendKeys(name);

        const saveBtn = await this.driver.findElement(
            By.css(IamSelectors.SAVE_ROLE_BTN),
        );
        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async createUser(email) {
        const addBtn = await this.driver.findElement(
            By.css(IamSelectors.ADD_USER_BTN),
        );
        await addBtn.click();
        await this.driver.sleep(1000);

        const emailInput = await this.driver.findElement(
            By.css(IamSelectors.USER_EMAIL_INPUT),
        );
        await emailInput.sendKeys(email);

        const saveBtn = await this.driver.findElement(
            By.css(IamSelectors.SAVE_USER_BTN),
        );
        await saveBtn.click();
        await this.driver.sleep(1000);
    }

    async search(text) {
        const searchInput = await this.driver.findElement(
            By.css(IamSelectors.SEARCH_INPUT),
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }
}
