/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { IamPage } from "../page-objects/IamPage.js";

const APP_URL = "http://localhost:5173";

async function runIamTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting IAM Global Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        // 1. Roles
        console.log("\n[Test] 1. Roles Management");
        const rolesPage = new IamPage(driver, APP_URL, "roles");
        await rolesPage.navigate();

        const roleName = `Role-${Date.now()}`;
        await rolesPage.createRole(roleName);
        await rolesPage.search(roleName);
        console.log(`  -> Role created and found: ${roleName}. PASS.`);

        // 2. Users
        console.log("\n[Test] 2. Users Management");
        const usersPage = new IamPage(driver, APP_URL, "user-access"); // Adjust route if needed
        await usersPage.navigate();

        const userEmail = `user${Date.now()}@e2e.test`;
        await usersPage.createUser(userEmail);
        await usersPage.search(userEmail);
        console.log(`  -> User created and found: ${userEmail}. PASS.`);

        console.log("\nAll IAM Regression scenarios covered.");
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

runIamTests();
