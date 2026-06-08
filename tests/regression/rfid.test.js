/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { RfidPage } from "../page-objects/RfidPage.js";

const APP_URL = "http://localhost:5173";

const RFID_ROUTES = [
    { path: "tags", desc: "Tag Registration" },
    { path: "assignments", desc: "Tag Assignments" },
    { path: "events", desc: "RFID Events" },
];

async function runRfidTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting RFID Global Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        for (const route of RFID_ROUTES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing RFID Module: ${route.desc}`);
            console.log(`================================`);

            const rfidPage = new RfidPage(driver, APP_URL, route.path);

            console.log(`[Test] 1. Navigate to /rfid/${route.path}`);
            await rfidPage.navigate();
            console.log(`  -> Page loaded. PASS.`);

            // Search functionality exists on all 3 pages
            console.log(`[Test] 2. Search Table`);
            const testSearchTerm = `TEST-${Date.now()}`;
            await rfidPage.search(testSearchTerm);
            console.log(`  -> Search executed. PASS.`);

            // Only perform registerTag on the 'tags' page
            if (route.path === "tags") {
                console.log(`[Test] 3. Register New Tag`);
                await rfidPage.registerTag(
                    `EPC-${Date.now()}`,
                    `SKU-${Date.now()}`,
                );
                console.log(`  -> Tag registered. PASS.`);
            }
        }

        console.log("\nAll RFID Regression scenarios covered.");
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

runRfidTests();
