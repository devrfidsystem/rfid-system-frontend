import { By, until } from "selenium-webdriver";
import { StockSelectors } from "../selectors/stock.selectors.js";

export class StockPage {
    constructor(driver, appUrl, route = "balance") {
        this.driver = driver;
        this.url = `${appUrl}/stock/${route}`;
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(By.css("body")), 5000);
        await this.driver.sleep(1000);
    }

    async searchStock(text) {
        const searchInput = await this.driver.findElement(
            By.css(StockSelectors.SEARCH_INPUT),
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }

    async filterByWarehouse(warehouseName) {
        const warehouseFilter = await this.driver.findElement(
            By.css(StockSelectors.WAREHOUSE_FILTER),
        );
        await warehouseFilter.click();
        await warehouseFilter.sendKeys(warehouseName);
        await this.driver.sleep(1500);
    }

    async setDateRange(dateString) {
        // Mock interaction for Date Picker standard
        const dateFilter = await this.driver.findElement(
            By.css(StockSelectors.DATE_RANGE_FILTER),
        );
        await dateFilter.click();
        await dateFilter.sendKeys(dateString);
        await this.driver.sleep(1500);
    }
}
