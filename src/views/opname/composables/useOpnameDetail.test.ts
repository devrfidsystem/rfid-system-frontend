import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { useOpnameDetail } from "./useOpnameDetail";

const getTreeMock = vi.hoisted(() => vi.fn());
const getDetailMock = vi.hoisted(() => vi.fn());
const updateLineCountMock = vi.hoisted(() => vi.fn());
const startCountingMock = vi.hoisted(() => vi.fn());
const reconcileMock = vi.hoisted(() => vi.fn());
const closeMock = vi.hoisted(() => vi.fn());
const cancelDocMock = vi.hoisted(() => vi.fn());
const routerPushMock = vi.hoisted(() => vi.fn());
const notifySuccessMock = vi.hoisted(() => vi.fn());
const notifyErrorMock = vi.hoisted(() => vi.fn());

var authStoreState: {
    currentCompanyId: string | null;
};
var warehouseOptionsRef: {
    value: { id: string; code: string; name: string }[];
};
var routeState: {
    params: { id?: string };
    query: { warehouseId?: string };
};

vi.mock("@/store/auth.store", async () => {
    const { reactive } = await import("vue");
    authStoreState = reactive({
        currentCompanyId: "company-1" as string | null,
    });
    return {
        useAuthStore: () => authStoreState,
    };
});

vi.mock("@/services/opname.service", () => ({
    opnameService: {
        getTree: getTreeMock,
        getDetail: getDetailMock,
        updateLineCount: updateLineCountMock,
        startCounting: startCountingMock,
        reconcile: reconcileMock,
        close: closeMock,
        cancel: cancelDocMock,
    },
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        notifySuccess: notifySuccessMock,
        notifyError: notifyErrorMock,
    }),
}));

vi.mock("@/composable/useWarehouseOptions", async () => {
    const { ref } = await import("vue");
    warehouseOptionsRef = ref([
        { id: "wh-1", code: "WH1", name: "Main Warehouse" },
    ]);
    return {
        useWarehouseOptions: () => ({
            options: warehouseOptionsRef,
            loading: ref(false),
            error: ref(null),
            refresh: vi.fn(),
        }),
    };
});

vi.mock("vue-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("vue-router")>();
    routeState = {
        params: { id: "root-1" },
        query: { warehouseId: "wh-1" },
    };
    return {
        ...actual,
        useRoute: () => routeState,
        useRouter: () => ({
            push: routerPushMock,
        }),
    };
});

describe("useOpnameDetail", () => {
    beforeEach(() => {
        getTreeMock.mockReset();
        getDetailMock.mockReset();
        updateLineCountMock.mockReset();
        startCountingMock.mockReset();
        reconcileMock.mockReset();
        closeMock.mockReset();
        cancelDocMock.mockReset();
        routerPushMock.mockReset();
        notifySuccessMock.mockReset();
        notifyErrorMock.mockReset();

        getTreeMock.mockResolvedValue([
            {
                id: "root-1",
                parentId: null,
                companyId: "company-1",
                warehouse_id: "wh-1",
                profile_id: "OP-ROOT",
                title: "Root Opname",
                description: "Root description",
                task_group: "Group A",
                task_period: "January",
                status: "draft",
                nodeType: "group",
                children: [],
            },
        ]);

        getDetailMock.mockResolvedValue({
            id: "root-1",
            nodeType: "task",
            lines: [
                {
                    id: "line-1",
                    docId: "root-1",
                    productId: "prod-1",
                    locationId: "loc-1",
                    qtySystem: 10,
                    qtyCounted: 7,
                    qtyDiff: -3,
                    product: {
                        id: "prod-1",
                        code: "PRD-001",
                        name: "Sample Item",
                    },
                    location: {
                        id: "loc-1",
                        code: "LOC-1",
                        name: "Rack A",
                    },
                },
            ],
        });

        updateLineCountMock.mockResolvedValue({
            id: "line-1",
            docId: "root-1",
            productId: "prod-1",
            locationId: "loc-1",
            qtySystem: 10,
            qtyCounted: 7,
            qtyDiff: -3,
            product: {
                id: "prod-1",
                code: "PRD-001",
                name: "Sample Item",
            },
            location: {
                id: "loc-1",
                code: "LOC-1",
                name: "Rack A",
            },
        });
    });

    it("opens the item drawer and submits a supported line action to backend", async () => {
        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        expect(detail.drawerActions.map((action) => action.key)).toEqual([
            "match",
            "unmatch",
        ]);
        expect(detail.selectedNode.value?.id).toBe("root-1");
        expect(detail.selectedDetailLines.value).toHaveLength(1);
        expect(detail.isItemDrawerOpen.value).toBe(false);

        detail.openDetail(detail.selectedDetailLines.value[0]);
        expect(detail.isItemDrawerOpen.value).toBe(true);
        expect(detail.selectedLineItem.value?.id).toBe("line-1");
        expect(detail.selectedItemAction.value).toBe("match");
        expect(detail.selectedItemActionSupported.value).toBe(true);

        detail.activeActionForm.value.expectedQty = "10";
        detail.activeActionForm.value.actualQty = "12";
        detail.activeActionForm.value.note = "Verified";

        await detail.submitItemAction();

        expect(updateLineCountMock).toHaveBeenCalledWith("root-1", "line-1", {
            qtyCounted: 12,
            notes: "Match | Note: Verified",
        });
        expect(notifySuccessMock).toHaveBeenCalledWith(
            "Match saved for Sample Item.",
        );
        expect(detail.isItemDrawerOpen.value).toBe(false);
    });

    it("gates start-counting/reconcile/close/cancel by node type and status", async () => {
        getTreeMock.mockResolvedValue([
            {
                id: "root-1",
                parentId: null,
                companyId: "company-1",
                warehouse_id: "wh-1",
                profile_id: "OP-ROOT",
                title: "Root Opname",
                description: null,
                task_group: null,
                task_period: null,
                status: "draft",
                nodeType: "task",
                children: [],
            },
        ]);

        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        expect(detail.canStartCounting.value).toBe(true);
        expect(detail.canReconcile.value).toBe(false);
        expect(detail.canClose.value).toBe(false);
        expect(detail.canCancelDoc.value).toBe(true);
    });

    it("does not offer document lifecycle actions on group/profile nodes", async () => {
        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        // Default mock resolves a "group" node — none of the doc-level
        // lifecycle actions apply to organizational tree nodes.
        expect(detail.canStartCounting.value).toBe(false);
        expect(detail.canReconcile.value).toBe(false);
        expect(detail.canClose.value).toBe(false);
        expect(detail.canCancelDoc.value).toBe(false);
    });

    it("calls opnameService.startCounting with the selected warehouse and refreshes", async () => {
        getTreeMock.mockResolvedValue([
            {
                id: "root-1",
                parentId: null,
                companyId: "company-1",
                warehouse_id: "wh-1",
                profile_id: "OP-ROOT",
                title: "Root Opname",
                description: null,
                task_group: null,
                task_period: null,
                status: "draft",
                nodeType: "task",
                children: [],
            },
        ]);
        startCountingMock.mockResolvedValue(undefined);

        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        detail.handleStartCounting();
        expect(detail.docConfirmation.value).toMatchObject({
            action: "start-counting",
            title: "Start Counting",
        });

        await detail.handleConfirmDocAction();

        expect(startCountingMock).toHaveBeenCalledWith("root-1", "wh-1");
        expect(notifySuccessMock).toHaveBeenCalledWith(
            "Start Counting succeeded.",
        );
        expect(detail.docConfirmation.value).toBeNull();
        expect(getTreeMock).toHaveBeenCalledTimes(2); // initial load + refresh
    });

    it("surfaces an error notification when a lifecycle action fails", async () => {
        getTreeMock.mockResolvedValue([
            {
                id: "root-1",
                parentId: null,
                companyId: "company-1",
                warehouse_id: "wh-1",
                profile_id: "OP-ROOT",
                title: "Root Opname",
                description: null,
                task_group: null,
                task_period: null,
                status: "counting",
                nodeType: "task",
                children: [],
            },
        ]);
        reconcileMock.mockRejectedValue(new Error("Cannot reconcile yet"));

        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        expect(detail.canReconcile.value).toBe(true);
        detail.handleReconcile();
        await detail.handleConfirmDocAction();

        expect(reconcileMock).toHaveBeenCalledWith("root-1");
        expect(notifyErrorMock).toHaveBeenCalledWith("Cannot reconcile yet");
    });
});
