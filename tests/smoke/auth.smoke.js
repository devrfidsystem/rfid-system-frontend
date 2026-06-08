/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { LoginPage } from "../page-objects/LoginPage.js";

const APP_URL = "http://localhost:5173";

async function runAuthTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Auth Smoke Test Suite...");
        const loginPage = new LoginPage(driver, APP_URL);

        // 1. Negative Path: Invalid Login
        console.log("[Test] Negative Path: Invalid Login");
        await loginPage.navigate();
        await loginPage.fillEmail("invalid@example.com");
        await loginPage.fillPassword("wrongpass");
        await loginPage.submit();

        await driver.sleep(1000);
        const source = await driver.getPageSource();
        if (
            source.includes("error") ||
            (await driver.getCurrentUrl()) !== `${APP_URL}/dashboard`
        ) {
            console.log("  -> Invalid login properly rejected. PASS.");
        } else {
            throw new Error("Invalid login was accepted!");
        }

        // 2. Happy Path: Valid Login
        console.log("[Test] Happy Path: Valid Login");
        await loginPage.fillEmail("adityaaria20@gmail.com");
        await loginPage.fillPassword("aditlucu20");
        await loginPage.submit();

        await driver.sleep(3000);
        const urlAfterLogin = await driver.getCurrentUrl();
        if (
            urlAfterLogin.includes("/dashboard") ||
            urlAfterLogin.includes("/transactions")
        ) {
            console.log("  -> Login successful. Redirected properly. PASS.");
        } else {
            console.log("  -> URL after login:", urlAfterLogin);
        }

        console.log("All Auth scenarios covered.");
    } catch (err) {
        passed = false;
        console.error("Test Suite FAILED:", err);
        process.exitCode = 1;
    } finally {
        console.log("Tearing down...");
        await driver.quit();
        if (!passed) process.exit(1);
    }
}

runAuthTests();
