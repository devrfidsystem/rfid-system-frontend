import { By, until } from "selenium-webdriver";
import { LoginSelectors } from "../selectors/login.selectors.js";

export class AuthHelper {
    static async login(driver, appUrl, email, password) {
        await driver.get(`${appUrl}/login`);

        const emailInput = await driver.wait(
            until.elementLocated(By.css(LoginSelectors.EMAIL_INPUT)),
            5000,
        );

        await driver.wait(until.elementIsVisible(emailInput), 5000);
        await emailInput.clear();
        await emailInput.sendKeys(email);

        const passwordInput = await driver.findElement(
            By.css(LoginSelectors.PASSWORD_INPUT),
        );
        await passwordInput.clear();
        await passwordInput.sendKeys(password);

        const loginBtn = await driver.findElement(
            By.css(LoginSelectors.SUBMIT_BTN),
        );
        await loginBtn.click();

        await driver.wait(
            until.urlMatches(new RegExp(`^${appUrl}/(dashboard|transactions)`)),
            10000,
        );
    }
}
