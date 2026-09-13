/* eslint-disable no-console */
import { By, until } from "selenium-webdriver";
import { Builder } from "selenium-webdriver";
import { AuthHelper } from "../helpers/AuthHelper.js";
import { navigateInApp } from "../helpers/navigation.js";

const APP_URL = "http://localhost:5173";

const TRANSACTION_SURFACES = [
    {
        key: "register",
        listPath: "/transactions/register",
        createPath: "/transactions/register/new",
        requiredCreateSelectors: [
            "[object-id='txt_TransactionCreateDocNumber']",
            "[object-id='dtp_TransactionCreateDate']",
            "[object-id='cmb_TransactionCreateRegisteredBy']",
            "[object-id='cmb_TransactionCreateRegisterWarehouse']",
            "[object-id='wdg_TransactionLineItems']",
        ],
        forbiddenCreateSelectors: [
            "[object-id='cmb_TransactionCreateRegisterLocation']",
        ],
        validateMandatory: true,
    },
    {
        key: "inbound",
        listPath: "/transactions/inbound",
        createPath: "/transactions/inbound/new",
        requiredCreateSelectors: [
            "[object-id='txt_TransactionCreateDocNumber']",
            "[object-id='dtp_TransactionCreateDate']",
            "[object-id='cmb_TransactionCreateWarehouse']",
            "[object-id='cmb_TransactionCreatePartner']",
            "[object-id='wdg_TransactionLineItems']",
        ],
        validateMandatory: true,
    },
    {
        key: "putaway",
        listPath: "/transactions/putaway",
        createPath: "/transactions/putaway/new",
        requiredCreateSelectors: [
            "[object-id='txt_TransactionCreateDocNumber']",
            "[object-id='dtp_TransactionCreateDate']",
            "[object-id='cmb_TransactionCreateWarehouse']",
            "[object-id='txt_TransactionCreateReferenceType']",
            "[object-id='txt_TransactionCreateReferenceId']",
            "[object-id='wdg_TransactionLineItems']",
        ],
        validateMandatory: true,
    },
    {
        key: "outbound",
        listPath: "/transactions/outbound",
        createPath: "/transactions/outbound/new",
        requiredCreateSelectors: [
            "[object-id='txt_TransactionCreateDocNumber']",
            "[object-id='dtp_TransactionCreateDate']",
            "[object-id='cmb_TransactionCreateWarehouse']",
            "[object-id='cmb_TransactionCreatePartner']",
            "[object-id='cmb_TransactionCreateAssignedBy']",
            "[object-id='dtp_TransactionCreateDeadline']",
            "[object-id='wdg_TransactionLineItems']",
        ],
    },
    {
        key: "relocation",
        listPath: "/transactions/relocation",
        createPath: "/transactions/relocation/new",
        requiredCreateSelectors: [
            "[object-id='txt_TransactionCreateDocNumber']",
            "[object-id='dtp_TransactionCreateDate']",
            "[object-id='cmb_TransactionCreateWarehouse']",
            "[object-id='wdg_TransactionLineItems']",
        ],
    },
    {
        key: "returns",
        listPath: "/transactions/returns",
        createPath: "/transactions/returns/new",
        requiredCreateSelectors: [
            "[object-id='txt_TransactionCreateDocNumber']",
            "[object-id='dtp_TransactionCreateDate']",
            "[object-id='cmb_TransactionCreateWarehouse']",
            "[object-id='cmb_TransactionCreatePartner']",
            "[object-id='wdg_TransactionLineItems']",
        ],
    },
];

const OPNAME_SURFACES = [
    {
        name: "Opname Tree",
        path: "/transactions/opname",
        requiredSelectors: [
            "[object-id='txt_OpnameTreeSearch']",
            "[object-id='btn_OpnameTreeFilter']",
            "[object-id='btn_OpnameTreeRefresh']",
            "[object-id='btn_OpnameTreeNew']",
            "[object-id='wdg_OpnameTree']",
        ],
    },
    {
        name: "Opname Group Create",
        path: "/transactions/opname/new?mode=group",
        requiredSelectors: [
            "[object-id='txt_OpnameCreateDocNumber']",
            "[object-id='txt_OpnameCreateTitle']",
            "[object-id='cmb_OpnameCreateWarehouse']",
            "[object-id='btn_OpnameCreateSubmit']",
        ],
        forbiddenSelectors: ["[object-id='cmb_OpnameCreateParent']"],
    },
    {
        name: "Opname Profile Create",
        path: "/transactions/opname/new?mode=profile",
        requiredSelectors: [
            "[object-id='txt_OpnameCreateDocNumber']",
            "[object-id='txt_OpnameCreateTitle']",
            "[object-id='cmb_OpnameCreateWarehouse']",
            "[object-id='cmb_OpnameCreateParent']",
            "[object-id='btn_OpnameCreateSubmit']",
        ],
    },
    {
        name: "Opname Task Create",
        path: "/transactions/opname/new?mode=task",
        requiredSelectors: [
            "[object-id='txt_OpnameCreateDocNumber']",
            "[object-id='txt_OpnameCreateTitle']",
            "[object-id='cmb_OpnameCreateWarehouse']",
            "[object-id='cmb_OpnameCreateParent']",
            "[object-id='btn_OpnameCreateSubmit']",
        ],
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

async function assertAbsent(driver, selector) {
    const elements = await driver.findElements(By.css(selector));
    if (elements.length > 0) {
        throw new Error(`Forbidden selector is present: ${selector}`);
    }
}

async function assertInvalidSubmitStaysOnPage(driver, submitSelector, path) {
    const submitButton = await waitForVisible(driver, submitSelector);
    await driver.executeScript(
        "const form = document.querySelector('form'); if (form) form.noValidate = true;",
    );
    await submitButton.click();
    await driver.sleep(750);
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes(path)) {
        throw new Error(
            `Invalid mandatory submit left create page. Expected ${path}, got ${currentUrl}`,
        );
    }
}

async function runTransactionSurfaceRegression() {
    const driver = await new Builder().forBrowser("chrome").build();
    let passed = true;

    try {
        console.log("Starting Transaction Surface Regression Test Suite...");

        console.log("[Test] Precondition: Logging in via AuthHelper...");
        await AuthHelper.login(
            driver,
            APP_URL,
            "adityaaria20@gmail.com",
            "aditlucu20",
        );

        for (const surface of TRANSACTION_SURFACES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing Transaction: ${surface.key}`);
            console.log(`================================`);

            console.log(`[Test] 1. Load list ${surface.listPath}`);
            await navigateInApp(driver, `${APP_URL}${surface.listPath}`);
            await waitForVisible(
                driver,
                "[object-id='txt_TransactionHeaderSearch']",
            );
            await waitForVisible(
                driver,
                "[object-id='btn_TransactionHeaderFilter']",
            );
            console.log("  -> List controls loaded. PASS.");

            console.log(`[Test] 2. Load create ${surface.createPath}`);
            await navigateInApp(driver, `${APP_URL}${surface.createPath}`);
            await waitForVisible(
                driver,
                "[object-id='wdg_TransactionCreateDetails']",
            );
            for (const selector of surface.requiredCreateSelectors) {
                await waitForVisible(driver, selector);
            }
            for (const selector of surface.forbiddenCreateSelectors ?? []) {
                await assertAbsent(driver, selector);
            }
            console.log("  -> Create controls wired. PASS.");

            if (surface.validateMandatory) {
                console.log(
                    "[Test] 3. Mandatory validation blocks invalid submit",
                );
                await assertInvalidSubmitStaysOnPage(
                    driver,
                    "[object-id='btn_TransactionLineItemsSave']",
                    surface.createPath,
                );
                console.log("  -> Invalid submit stayed on create page. PASS.");
            }
        }

        for (const surface of OPNAME_SURFACES) {
            console.log(`\n================================`);
            console.log(`[Suite] Testing: ${surface.name}`);
            console.log(`================================`);

            await navigateInApp(driver, `${APP_URL}${surface.path}`);
            for (const selector of surface.requiredSelectors) {
                await waitForVisible(driver, selector);
            }
            for (const selector of surface.forbiddenSelectors ?? []) {
                await assertAbsent(driver, selector);
            }
            if (
                surface.path.includes("mode=profile") ||
                surface.path.includes("mode=task")
            ) {
                console.log(
                    "[Test] Mandatory parent validation blocks invalid submit",
                );
                await assertInvalidSubmitStaysOnPage(
                    driver,
                    "[object-id='btn_OpnameCreateSubmit']",
                    surface.path,
                );
                console.log("  -> Invalid submit stayed on create page. PASS.");
            }
            console.log("  -> Opname surface wired. PASS.");
        }

        console.log("\nAll transaction surfaces tested successfully.");
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

runTransactionSurfaceRegression();
