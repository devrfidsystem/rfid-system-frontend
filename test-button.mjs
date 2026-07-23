import { chromium } from "playwright";

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        await page.goto("http://localhost:5173/register", {
            waitUntil: "networkidle",
        });

        // Get the computed border-radius of the submit button
        const borderRadius = await page.evaluate(() => {
            const button = document.querySelector(
                'button[object-id="btn_RegisterSubmit"]',
            );
            if (!button) {
                return { error: "Button not found" };
            }
            const computed = window.getComputedStyle(button);
            return {
                borderRadius: computed.borderRadius,
                borderTopLeftRadius: computed.borderTopLeftRadius,
            };
        });

        console.log(JSON.stringify(borderRadius, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
