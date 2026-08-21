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
            until.elementLocated(
                By.css(DashboardSelectors.ALERT_CENTER_WIDGET),
            ),
            10000,
        );
        await this.driver.sleep(1000);
    }

    async getAlertCenterWidget() {
        return await this.driver.findElement(
            By.css(DashboardSelectors.ALERT_CENTER_WIDGET),
        );
    }

    async getWorkflowOverviewWidget() {
        return await this.driver.findElement(
            By.css(DashboardSelectors.WORKFLOW_OVERVIEW_WIDGET),
        );
    }

    async getKpiSnapshotWidget() {
        return await this.driver.findElement(
            By.css(DashboardSelectors.KPI_SNAPSHOT_WIDGET),
        );
    }
}
