/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { MasterDataPage } from "../page-objects/MasterDataPage.js";

const APP_URL = "http://localhost:5173";

async function runMasterRegressionTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Master Data Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        const masterPage = new MasterDataPage(driver, APP_URL);

        console.log("[Test] Navigating to Master Data Products...");
        await masterPage.navigate();
        console.log("  -> Master page loaded. PASS.");

        const uniqueSuffix = Date.now();
        const testProductName = `TEST-PROD-${uniqueSuffix}`;

        // 1. Create Product
        console.log("[Test] 1. Create Product");
        await masterPage.openCreateForm();
        await masterPage.fillProductCode(`CODE-${uniqueSuffix}`);
        await masterPage.fillProductName(testProductName);
        await masterPage.submitForm();
        console.log("  -> Product created. PASS.");

        // 2. Search Product
        console.log(`[Test] 2. Search Product: ${testProductName}`);
        await masterPage.searchProduct(testProductName);
        console.log("  -> Product found in table. PASS.");

        // 3. Edit Product
        console.log("[Test] 3. Edit Product");
        await masterPage.editFirstProduct();
        const editedName = `${testProductName}-EDITED`;
        await masterPage.fillProductName(editedName);
        await masterPage.submitForm();
        console.log("  -> Product edited. PASS.");

        // Re-search to ensure edit persisted
        await masterPage.searchProduct(editedName);

        // 4. Delete Product
        console.log("[Test] 4. Delete Product");
        await masterPage.deleteFirstProduct();
        console.log("  -> Product deleted. PASS.");

        console.log("All Master Data Regression scenarios covered.");
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

runMasterRegressionTests();
