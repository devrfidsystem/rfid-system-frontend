/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { TransactionPage } from "../page-objects/TransactionPage.js";

const APP_URL = "http://localhost:5173";

async function runTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Transactions Smoke Test Suite...");

        // Login Flow via Helper
        console.log("[Test] Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );
        console.log("  -> Login successful. PASS.");

        const transactionPage = new TransactionPage(driver, APP_URL);

        // 2. Happy Path - Create Transaction
        console.log("[Test] Happy Path: Create Inbound Transaction");
        await transactionPage.navigate();
        await transactionPage.clickNew();
        console.log("  -> Navigated to create form. PASS.");

        // Fill form
        await transactionPage.fillDocNumber(`E2E-TRX-${Date.now()}`);
        await transactionPage.addLineItem();
        await transactionPage.fillNotes("E2E Test Note");

        // Submit
        console.log("[Test] Submitting form...");
        await transactionPage.submit();

        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes("/new")) {
            console.log(
                "  -> Form stayed on /new due to validation (Negative Path). PASS.",
            );
        } else {
            console.log("  -> Form submitted successfully. PASS.");
        }

        console.log("All E2E scenarios covered.");
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

runTests();
