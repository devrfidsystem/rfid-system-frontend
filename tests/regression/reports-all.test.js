/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { ReportPage } from "../page-objects/ReportPage.js";

const APP_URL = "http://localhost:5173";

const REPORT_ROUTES = [
    { path: "stock-movement", name: "Stock Movement" },
    { path: "stock-balance-report", name: "Stock Balance Report" },
    { path: "inbound-report", name: "Inbound Report" },
    { path: "outbound-report", name: "Outbound Report" },
    { path: "opname-variance-report", name: "Opname Variance Report" },
];

async function runReportsTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log(
            "Starting Reports Global Regression Test Suite (Data-Driven)...",
        );

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        for (const route of REPORT_ROUTES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing Report Module: ${route.name}`);
            console.log(`================================`);

            const reportPage = new ReportPage(driver, APP_URL, route.path);

            console.log(`[Test] 1. Navigate to /reports/${route.path}`);
            await reportPage.navigate();
            console.log(`  -> Page loaded. PASS.`);

            console.log(`[Test] 2. Filter by Date Range`);
            await reportPage.filterByDateRange("Last 30 Days");
            console.log(`  -> Filter applied. PASS.`);

            console.log(`[Test] 3. Search and Export`);
            await reportPage.search("TEST");
            await reportPage.exportReport();
            console.log(`  -> Export triggered successfully. PASS.`);
        }

        console.log("\nAll Reports tested successfully.");
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

runReportsTests();
