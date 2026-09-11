/* eslint-disable no-console */
import { By, until } from "selenium-webdriver";
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";

const APP_URL = "http://localhost:5173";

const EXPORT_SURFACES = [
    {
        path: "/stock/balance",
        name: "Stock Balance Export",
        exportSelector: "[object-id='btn_StockBalanceExport']",
        searchSelector: "[object-id='txt_StockBalanceSearch']",
    },
    {
        path: "/stock/ledger",
        name: "Stock Ledger Export",
        exportSelector: "[object-id='btn_StockLedgerExport']",
        searchSelector: "[object-id='txt_StockLedgerSearch']",
    },
    {
        path: "/transactions/inbound",
        name: "Inbound Report Export",
        exportSelector: "[object-id='btn_TransactionHeaderExport']",
        searchSelector: "[object-id='txt_TransactionHeaderSearch']",
    },
    {
        path: "/transactions/outbound",
        name: "Outbound Report Export",
        exportSelector: "[object-id='btn_TransactionHeaderExport']",
        searchSelector: "[object-id='txt_TransactionHeaderSearch']",
    },
];

async function waitForVisible(driver, selector) {
    const element = await driver.wait(
        until.elementLocated(By.css(selector)),
        10000,
    );
    await driver.wait(until.elementIsVisible(element), 5000);
    return element;
}

async function runReportExportSurfaceTests() {
    const driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Report Export Surface Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        for (const surface of EXPORT_SURFACES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing: ${surface.name}`);
            console.log(`================================`);

            console.log(`[Test] 1. Navigate to ${surface.path}`);
            await driver.get(`${APP_URL}${surface.path}`);
            await waitForVisible(driver, "body");
            console.log("  -> Page loaded. PASS.");

            console.log("[Test] 2. Search control is wired");
            const searchInput = await waitForVisible(
                driver,
                surface.searchSelector,
            );
            await searchInput.clear();
            await searchInput.sendKeys("TEST");
            console.log("  -> Search executed. PASS.");

            console.log("[Test] 3. Export control is present");
            await waitForVisible(driver, surface.exportSelector);
            console.log("  -> Export control found. PASS.");
        }

        console.log("\nAll report/export surfaces tested successfully.");
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

runReportExportSurfaceTests();
