/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { SettingsPage } from "../page-objects/SettingsPage.js";

const APP_URL = "http://localhost:5173";

const SETTINGS_ROUTES = [
    { path: "companies", type: "companies" },
    { path: "apps", type: "apps" },
    { path: "menus", type: "menus" },
];

async function runSettingsTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Settings Global Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        for (const route of SETTINGS_ROUTES) {
            console.log(`\n================================`);
            console.log(
                `[Suite] Testing Settings Module: ${route.path.toUpperCase()}`,
            );
            console.log(`================================`);

            const settingsPage = new SettingsPage(driver, APP_URL, route.path);

            console.log(`[Test] 1. Navigate to /settings/${route.path}`);
            await settingsPage.navigate();
            console.log(`  -> Page loaded. PASS.`);

            // Only perform creation on companies and apps for now
            if (route.type === "companies" || route.type === "apps") {
                console.log(`[Test] 2. Create ${route.type}`);
                const testName = `TEST-${route.type.toUpperCase()}-${Date.now()}`;
                await settingsPage.createItem(testName, route.type);
                console.log(`  -> Item created. PASS.`);

                console.log(`[Test] 3. Search ${route.type}`);
                await settingsPage.search(testName);
                console.log(`  -> Search executed. PASS.`);
            } else {
                console.log(`[Test] 2. Search menus`);
                await settingsPage.search("Dashboard");
                console.log(`  -> Search executed. PASS.`);
            }
        }

        console.log("\nAll Settings Regression scenarios covered.");
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

runSettingsTests();
