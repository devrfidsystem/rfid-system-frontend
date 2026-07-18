import { render, screen } from "@testing-library/vue";
import DashboardPage from "./DashboardPage.vue";

it("renders the operational intelligence section headings", async () => {
    render(DashboardPage);

    expect(await screen.findByText("Operations Alert Center")).toBeTruthy();
    expect(screen.getByText("Business Workflow Overview")).toBeTruthy();
    expect(screen.getByText("Executive KPI Snapshot")).toBeTruthy();
});
