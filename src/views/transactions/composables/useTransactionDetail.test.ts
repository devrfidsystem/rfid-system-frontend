import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getSpy: vi.fn(),
    postSpy: vi.fn(),
    cancelSpy: vi.fn(),
    pushSpy: vi.fn(),
    notifyErrorSpy: vi.fn(),
    notifySuccessSpy: vi.fn(),
}));

vi.mock("vue-router", () => ({
    useRouter: () => ({
        push: mocks.pushSpy,
    }),
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        notifyError: mocks.notifyErrorSpy,
        notifySuccess: mocks.notifySuccessSpy,
    }),
}));

vi.mock("@/services/transactions.service", () => ({
    transactionService: {
        get: mocks.getSpy,
        post: mocks.postSpy,
        cancel: mocks.cancelSpy,
    },
}));

vi.mock("@/views/report/reportConfig", () => ({
    reportConfigs: {
        relocation: {
            entity: "relocation",
            title: "Relocation Report",
            description: "Moving inventory between locations.",
            columns: [
                { key: "relocation_no", label: "Doc No" },
                { key: "relocation_date", label: "Date" },
                { key: "status", label: "Status" },
            ],
            warehouseKey: "warehouseId",
        },
        outbound: {
            entity: "outbound",
            title: "Outbound Report",
            description: "Shipments and finished goods.",
            columns: [
                { key: "docNo", label: "ID Number" },
                { key: "type", label: "Type" },
                { key: "assignedBy.fullName", label: "Assigned User" },
                { key: "deadlineAt", label: "Deadline" },
                { key: "status", label: "Status" },
            ],
        },
    },
}));

describe("useTransactionDetail", () => {
    it("renders relocation detail copy and line fields", async () => {
        mocks.getSpy.mockResolvedValue({
            id: "rel-1",
            docNo: "REL-001",
            status: "draft",
            relocation_no: "REL-001",
            relocation_date: "2026-07-18T00:00:00.000Z",
            lines: [
                {
                    id: "line-1",
                    productId: "prod-1",
                    qty: 3,
                    fromLocationId: "loc-a",
                    toLocationId: "loc-b",
                    fromLocation: { id: "loc-a", code: "L-A", name: "Rack A" },
                    toLocation: { id: "loc-b", code: "L-B", name: "Rack B" },
                    product: {
                        id: "prod-1",
                        code: "PRD-1",
                        name: "Sample Item",
                    },
                },
            ],
        });

        const { useTransactionDetail } = await import("./useTransactionDetail");
        const detail = useTransactionDetail("relocation", "rel-1");

        await detail.loadTransaction();

        expect(mocks.getSpy).toHaveBeenCalledWith("relocation", "rel-1");
        expect(detail.pageTagline.value).toBe("Transaction Detail");
        expect(detail.pageDescription.value).toBe(
            "Details for relocation transaction",
        );
        expect(detail.actionLabel.value).toBe("Transaction");
        expect(detail.canShowActions.value).toBe(true);
        expect(detail.lines.value).toHaveLength(1);
        expect(detail.lines.value[0]).toMatchObject({
            fromLocationId: "loc-a",
            toLocationId: "loc-b",
            fromLocation: {
                code: "L-A",
                name: "Rack A",
            },
            toLocation: {
                code: "L-B",
                name: "Rack B",
            },
        });
    });

    it("renders outbound detail as review-only after draft", async () => {
        mocks.getSpy.mockResolvedValue({
            id: "out-1",
            docNo: "OUT-001",
            status: "posted",
            type: "Outbound",
            assignedBy: { fullName: "Asep" },
            deadlineAt: "2026-07-25T00:00:00.000Z",
            lines: [
                {
                    id: "line-1",
                    productId: "prod-1",
                    qty: 2,
                    sourceLocationId: "loc-a",
                    checkedAt: "2026-07-18T07:00:00.000Z",
                    checkedBy: { fullName: "Asep" },
                    product: {
                        id: "prod-1",
                        code: "PRD-1",
                        name: "Sample Item",
                    },
                },
            ],
        });

        const { useTransactionDetail } = await import("./useTransactionDetail");
        const detail = useTransactionDetail("outbound", "out-1");

        await detail.loadTransaction();

        expect(detail.pageTagline.value).toBe("Transaction Detail");
        expect(detail.pageDescription.value).toBe(
            "Review outbound document details and execution status.",
        );
        expect(detail.actionLabel.value).toBe("Outbound document");
        expect(detail.canShowActions.value).toBe(false);
        expect(detail.isOutbound.value).toBe(true);
        expect(detail.isOutboundReadOnly.value).toBe(true);
        expect(detail.statusLabel.value).toBe("Posted");
        expect(detail.statusTone.value).toBe("info");
        expect(detail.outboundReviewNote.value).toContain("Read-only review");
        expect(detail.lines.value).toHaveLength(1);
    });

    it("opens a confirmation dialog before posting register tasks", async () => {
        mocks.getSpy.mockResolvedValue({
            id: "reg-1",
            docNo: "REG-001",
            status: "draft",
            registeredBy: { fullName: "Asep" },
        });

        const { useTransactionDetail } = await import("./useTransactionDetail");
        const detail = useTransactionDetail("register", "reg-1");

        await detail.loadTransaction();
        detail.handlePost();

        expect(detail.confirmation.value).toMatchObject({
            action: "post",
            title: "Post Task",
            confirmText: "Post",
            cancelText: "Back",
            variant: "primary",
        });

        await detail.handleConfirmAction();

        expect(mocks.postSpy).toHaveBeenCalledWith("register", "reg-1");
        expect(detail.confirmation.value).toBeNull();
    });
});
