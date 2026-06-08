/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { DashboardPage } from "../page-objects/DashboardPage.js";

const APP_URL = "http://localhost:5173";

async function runDashboardTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Dashboard Regression Test Suite...");
        const dashboardPage = new DashboardPage(driver, APP_URL);

        // Setup Login
        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );
        console.log("  -> Login successful. PASS.");

        // 1. Navigate to Dashboard
        console.log("[Test] Navigate to Dashboard");
        await dashboardPage.navigate();
        console.log("  -> Dashboard loaded. PASS.");

        // 2. Verify Heatmap Widget Exists
        console.log("[Test] Verify Heatmap Widget renders");
        const heatmap = await dashboardPage.getHeatmapWidget();
        if (heatmap) {
            console.log("  -> Heatmap widget found. PASS.");
        } else {
            throw new Error("Heatmap widget is missing.");
        }

        // 3. Verify Low Stock Widget
        console.log("[Test] Verify Low Stock Widget and Redirection");
        const lowStockWidget = await dashboardPage.getLowStockWidget();
        if (lowStockWidget) {
            console.log("  -> Low Stock Widget found. PASS.");
            await dashboardPage.clickLowStockViewInventory();
            console.log("  -> Successfully redirected to Product List. PASS.");
        } else {
            throw new Error("Low Stock widget is missing.");
        }

        console.log("All Dashboard scenarios covered.");
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

runDashboardTests();
