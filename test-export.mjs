import { chromium } from "playwright";

async function testExport() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("Navigating to home...");
        await page.goto("http://localhost:5173/", {
            waitUntil: "networkidle",
            timeout: 30000,
        });

        await page.waitForTimeout(2000);

        // Check current URL
        const url = page.url();
        console.log("Current URL:", url);

        const content = await page.content();

        // Check for key elements
        if (content.includes("Stock Balance")) {
            console.log("Found Stock Balance page");
        }

        if (content.includes("ALIR")) {
            console.log("Found ALIR text (app is loaded)");
        }

        if (content.includes("btn_") || content.includes("object-id")) {
            console.log("Found object-id attributes");
        } else {
            console.log("No object-id attributes found");
        }

        // Check for Vue component data
        if (content.includes("__vite")) {
            console.log("Vite client loaded");
        }

        // Try the balance page
        console.log("\nNavigating to /stock/balance...");
        await page.goto("http://localhost:5173/stock/balance", {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });

        const url2 = page.url();
        console.log("Final URL:", url2);

        await page.waitForTimeout(2000);

        const content2 = await page.content();
        const lines = content2.split("\n");

        console.log(`Page size: ${content2.length} chars`);

        // Find and print the main content area
        for (let i = 0; i < lines.length; i++) {
            if (
                lines[i].includes("Stock Balance List") ||
                lines[i].includes("btn_StockBalance")
            ) {
                console.log("Found Stock Balance List around line", i);
                console.log(lines.slice(Math.max(0, i - 2), i + 10).join("\n"));
                break;
            }
        }
    } catch (error) {
        console.error("Test failed:", error.message);
    } finally {
        await context.close();
        await browser.close();
    }
}

testExport();
