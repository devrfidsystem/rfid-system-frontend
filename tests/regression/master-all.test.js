/* eslint-disable no-console */
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { MasterDataPage } from "../page-objects/MasterDataPage.js";

const APP_URL = "http://localhost:5173";

// Map of all master entities to be tested via loop
const MASTER_ENTITIES = [
    {
        route: "warehouses",
        name: "Warehouse",
        fields: {
            code: { value: `WH-${Date.now()}`, type: "text" },
            name: { value: `E2E Warehouse ${Date.now()}`, type: "text" },
            address: { value: "Test Address", type: "textarea" },
        },
        searchKey: "name",
    },
    {
        route: "locations",
        name: "Location",
        fields: {
            code: { value: `LOC-${Date.now()}`, type: "text" },
            name: { value: `E2E Location ${Date.now()}`, type: "text" },
            type: { value: "Aisle", type: "text" },
            warehouseId: { value: "WH-E2E", type: "text" }, // Simulated relation typing
        },
        searchKey: "name",
    },
    {
        route: "customers",
        name: "Customer",
        fields: {
            code: { value: `CUST-${Date.now()}`, type: "text" },
            name: { value: `E2E Customer ${Date.now()}`, type: "text" },
            email: { value: `cust${Date.now()}@e2e.test`, type: "text" },
        },
        searchKey: "name",
    },
    {
        route: "suppliers",
        name: "Supplier",
        fields: {
            code: { value: `SUP-${Date.now()}`, type: "text" },
            name: { value: `E2E Supplier ${Date.now()}`, type: "text" },
            email: { value: `sup${Date.now()}@e2e.test`, type: "text" },
        },
        searchKey: "name",
    },
    {
        route: "uoms",
        name: "UOM",
        fields: {
            code: { value: `UOM-${Date.now()}`, type: "text" },
            name: { value: `E2E UOM ${Date.now()}`, type: "text" },
        },
        searchKey: "name",
    },
    {
        route: "product-categories",
        name: "Category",
        fields: {
            code: { value: `CAT-${Date.now()}`, type: "text" },
            name: { value: `E2E Category ${Date.now()}`, type: "text" },
        },
        searchKey: "name",
    },
    {
        route: "products",
        name: "Product",
        fields: {
            code: { value: `PROD-${Date.now()}`, type: "text" },
            name: { value: `E2E Product ${Date.now()}`, type: "text" },
        },
        searchKey: "name",
    },
];

async function runMasterAllTests() {
    let driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log(
            "Starting Global Master Data E2E Test Suite (Data-Driven)...",
        );

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );
        console.log("  -> Login successful. PASS.");

        for (const entity of MASTER_ENTITIES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing Entity: ${entity.name}`);
            console.log(`================================`);

            const masterPage = new MasterDataPage(
                driver,
                APP_URL,
                entity.route,
            );

            console.log(`[Test] Navigating to /master-data/${entity.route}...`);
            await masterPage.navigate();
            console.log(`  -> ${entity.name} page loaded. PASS.`);

            // 1. Create
            console.log(`[Test] 1. Create ${entity.name}`);
            await masterPage.openCreateForm();
            await masterPage.fillForm(entity.fields);
            await masterPage.submitForm();
            console.log(`  -> ${entity.name} created. PASS.`);

            // 2. Search
            const searchValue = entity.fields[entity.searchKey].value;
            console.log(`[Test] 2. Search ${entity.name}: ${searchValue}`);
            await masterPage.search(searchValue);
            console.log(`  -> ${entity.name} found in table. PASS.`);

            // 3. Edit
            console.log(`[Test] 3. Edit ${entity.name}`);
            await masterPage.editFirstItem();
            const editedValue = `${searchValue}-EDITED`;

            // Just edit the searchKey field
            const editFields = {
                [entity.searchKey]: {
                    value: editedValue,
                    type: entity.fields[entity.searchKey].type,
                },
            };
            await masterPage.fillForm(editFields);
            await masterPage.submitForm();
            console.log(`  -> ${entity.name} edited. PASS.`);

            // 4. Delete
            console.log(`[Test] 4. Delete ${entity.name}`);
            await masterPage.search(editedValue);
            await masterPage.deleteFirstItem();
            console.log(`  -> ${entity.name} deleted. PASS.`);
        }

        console.log("\nAll Master Data entities tested successfully.");
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

runMasterAllTests();
