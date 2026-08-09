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

        // 2. Verify current dashboard widgets exist
        console.log("[Test] Verify Alert Center widget renders");
        const alertCenter = await dashboardPage.getAlertCenterWidget();
        if (alertCenter) {
            console.log("  -> Alert Center widget found. PASS.");
        } else {
            throw new Error("Alert Center widget is missing.");
        }

        console.log("[Test] Verify Workflow Overview widget renders");
        const workflowOverview =
            await dashboardPage.getWorkflowOverviewWidget();
        if (workflowOverview) {
            console.log("  -> Workflow Overview widget found. PASS.");
        } else {
            throw new Error("Workflow Overview widget is missing.");
        }

        console.log("[Test] Verify KPI Snapshot widget renders");
        const kpiSnapshot = await dashboardPage.getKpiSnapshotWidget();
        if (kpiSnapshot) {
            console.log("  -> KPI Snapshot widget found. PASS.");
        } else {
            throw new Error("KPI Snapshot widget is missing.");
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
