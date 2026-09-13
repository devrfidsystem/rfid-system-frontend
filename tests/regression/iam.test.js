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
        if (!(await rolesPage.verifyRolesSurface())) {
            throw new Error("Roles surface is not visible.");
        }

        const roleName = `Role-${Date.now()}`;
        await rolesPage.createRole(roleName);
        await rolesPage.waitForText(roleName);
        console.log(`  -> Role created and found: ${roleName}. PASS.`);

        // 2. User access assignment surface
        console.log("\n[Test] 2. User Access Management");
        const usersPage = new IamPage(driver, APP_URL, "users");
        await usersPage.navigate();
        if (!(await usersPage.verifyUserAccessSurface())) {
            throw new Error("User access surface is not visible.");
        }
        console.log("  -> User access controls visible. PASS.");

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
