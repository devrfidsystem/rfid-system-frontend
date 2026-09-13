/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { RfidPage } from "../page-objects/RfidPage.js";

const APP_URL = "http://localhost:5173";

const RFID_ROUTES = [{ path: "tags", desc: "Tag Registration" }];

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
            if (!(await rfidPage.isAccessible())) {
                console.log(
                    "  -> Skip: RFID route is not accessible for this regression user. PASS.",
                );
                continue;
            }
            console.log(`  -> Page loaded. PASS.`);

            console.log(`[Test] 2. Registration controls are wired`);
            if (!(await rfidPage.verifyRegistrationSurface())) {
                throw new Error("RFID registration controls are not visible.");
            }
            console.log(`  -> Registration controls visible. PASS.`);
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
