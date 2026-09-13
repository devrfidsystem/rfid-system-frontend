import { By, until } from "selenium-webdriver";

export async function navigateInApp(driver, url) {
    const navigatedInApp = await driver.executeScript(
        `
        const target = new URL(arguments[0], window.location.origin);
        const app = document.querySelector("#app");
        if (target.origin === window.location.origin && app?.__vue_app__) {
            window.history.pushState({}, "", target.pathname + target.search + target.hash);
            window.dispatchEvent(new PopStateEvent("popstate"));
            return true;
        }
        return false;
        `,
        url,
    );

    if (!navigatedInApp) {
        await driver.get(url);
    }

    await driver.wait(until.elementLocated(By.css("body")), 5000);
    await driver.sleep(1000);
}
