import { By, until } from "selenium-webdriver";
import { DashboardSelectors } from "../selectors/dashboard.selectors.js";

export class DashboardPage {
    constructor(driver, appUrl) {
        this.driver = driver;
        this.url = `${appUrl}/dashboard`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(
            until.elementLocated(By.css(DashboardSelectors.HEATMAP_WIDGET)),
            10000,
        );
        await this.driver.sleep(1000);
    }

    async getHeatmapWidget() {
        return await this.driver.findElement(
            By.css(DashboardSelectors.HEATMAP_WIDGET),
        );
    }

    async getLowStockWidget() {
        return await this.driver.findElement(
            By.css(DashboardSelectors.LOW_STOCK_WIDGET),
        );
    }

    async clickLowStockViewInventory() {
        const link = await this.driver.findElement(
            By.css(DashboardSelectors.LOW_STOCK_VIEW_LINK),
        );
        await link.click();
        await this.driver.wait(
            until.urlContains("/master-data/products"),
            5000,
        );
    }
}
