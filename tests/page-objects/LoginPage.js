import { By, until } from "selenium-webdriver";
import { LoginSelectors } from "../selectors/login.selectors.js";

export class LoginPage {
    constructor(driver, appUrl) {
        this.driver = driver;
        this.url = `${appUrl}/login`;
    }

    async navigate() {
        await this.driver.get(this.url);
    }

    async fillEmail(email) {
        const emailInput = await this.driver.wait(
            until.elementLocated(By.css(LoginSelectors.EMAIL_INPUT)),
            5000,
        );
        await this.driver.wait(until.elementIsVisible(emailInput), 5000);
        await emailInput.clear();
        await emailInput.sendKeys(email);
    }

    async fillPassword(password) {
        const passwordInput = await this.driver.findElement(
            By.css(LoginSelectors.PASSWORD_INPUT),
        );
        await passwordInput.clear();
        await passwordInput.sendKeys(password);
    }

    async submit() {
        const loginBtn = await this.driver.findElement(
            By.css(LoginSelectors.SUBMIT_BTN),
        );
        await loginBtn.click();
    }
}
