import { By, until } from "selenium-webdriver";
import { StockSelectors } from "../selectors/stock.selectors.js";
import { navigateInApp } from "../helpers/navigation.js";

export class StockPage {
    constructor(driver, appUrl, route = "balance") {
        this.driver = driver;
        this.prefix = route === "ledger" ? "StockLedger" : "StockBalance";
        this.url = `${appUrl}/stock/${route}`;
    }

    async navigate() {
        await navigateInApp(this.driver, this.url);
    }

    async searchStock(text) {
        const searchInput = await this.driver.wait(
            until.elementLocated(
                By.css(StockSelectors.SEARCH_INPUT(this.prefix)),
            ),
            10000,
        );
        await searchInput.clear();
        await searchInput.sendKeys(text);
        await this.driver.sleep(1500);
    }

    async filterByWarehouse(warehouseName) {
        const filterBtn = await this.driver.wait(
            until.elementLocated(
                By.css(StockSelectors.FILTER_BTN(this.prefix)),
            ),
            10000,
        );
        await filterBtn.click();
        await this.driver.sleep(500);

        const warehouseFilter = await this.driver.findElement(
            By.css(StockSelectors.WAREHOUSE_FILTER(this.prefix)),
        );
        await warehouseFilter.click();
        await warehouseFilter.sendKeys(warehouseName);
        await this.driver.sleep(1500);
    }

    async verifyExportControl() {
        const exportBtn = await this.driver.findElement(
            By.css(StockSelectors.EXPORT_BTN(this.prefix)),
        );
        return await exportBtn.isDisplayed();
    }
}
