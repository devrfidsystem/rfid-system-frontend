import { By, until } from "selenium-webdriver";
import { ReportSelectors } from "../selectors/report.selectors.js";

export class ReportPage {
    constructor(driver, appUrl, route) {
        this.driver = driver;
        this.url = `${appUrl}/reports/${route}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async filterByDateRange(dateString) {
        const dateFilter = await this.driver.findElement(
            By.css(ReportSelectors.DATE_RANGE_FILTER),
        );
        await dateFilter.click();
        await dateFilter.sendKeys(dateString);
        await this.driver.sleep(1500);
    }

    async search(text) {
        const searchInput = await this.driver.findElement(
            By.css(ReportSelectors.SEARCH_INPUT),
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }

    async exportReport() {
        const exportBtn = await this.driver.findElement(
            By.css(ReportSelectors.EXPORT_BTN),
        );
        await exportBtn.click();
        await this.driver.sleep(2000);
    }
}
