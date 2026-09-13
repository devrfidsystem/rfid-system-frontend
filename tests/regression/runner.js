/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".test.js") && file !== "runner.js");

async function runTest(testFile) {
    return new Promise((resolve, reject) => {
        console.log(`\n========================================`);
        console.log(`RUNNING REGRESSION SUITE: ${testFile}`);
        console.log(`========================================\n`);

        const testProcess = spawn("node", [path.join(__dirname, testFile)], {
            stdio: "inherit",
        });

        testProcess.on("close", (code) => {
            if (code === 0) {
                console.log(`\nSUITE PASSED: ${testFile}\n`);
                resolve();
                return;
            }

            console.log(`\nSUITE FAILED: ${testFile} (Exit Code: ${code})\n`);
            reject(new Error(`Test failed: ${testFile}`));
        });
    });
}

async function runAll() {
    const failedTests = [];

    for (const testFile of tests) {
        try {
            await runTest(testFile);
        } catch {
            failedTests.push(testFile);
        }
    }

    console.log(`\n========================================`);
    console.log("REGRESSION FINAL REPORT");
    console.log(`========================================`);
    console.log(`Total Suites: ${tests.length}`);
    console.log(`Passed: ${tests.length - failedTests.length}`);
    console.log(`Failed: ${failedTests.length}`);

    if (failedTests.length > 0) {
        console.log(`Failed Suites: \n  - ${failedTests.join("\n  - ")}`);
        process.exit(1);
    }

    console.log("\nALL REGRESSION TESTS PASSED");
    process.exit(0);
}

runAll();
