/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { StockPage } from "../page-objects/StockPage.js";

const APP_URL = "http://localhost:5173";

const STOCK_ROUTES = ["balance", "ledger"];

async function runStockTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Stock Global Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );
        console.log("  -> Login successful. PASS.");

        for (const route of STOCK_ROUTES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing Stock Module: ${route.toUpperCase()}`);
            console.log(`================================`);

            const stockPage = new StockPage(driver, APP_URL, route);

            // 1. Navigation
            console.log(`[Test] 1. Load ${route} Page`);
            await stockPage.navigate();
            console.log(`  -> ${route} page loaded. PASS.`);

            // 2. Search
            console.log(`[Test] 2. Search inside ${route}`);
            await stockPage.searchStock("TEST-SKU");
            console.log(`  -> Search executed. PASS.`);

            // 3. Filter
            console.log(`[Test] 3. Filter ${route} by Warehouse`);
            await stockPage.filterByWarehouse("Main Warehouse");
            console.log(`  -> Filter executed. PASS.`);
        }

        console.log("\nAll Stock variants tested successfully.");
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

runStockTests();
