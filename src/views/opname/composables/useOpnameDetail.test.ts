import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { useOpnameDetail } from "./useOpnameDetail";

const getTreeMock = vi.hoisted(() => vi.fn());
const getDetailMock = vi.hoisted(() => vi.fn());
const updateLineCountMock = vi.hoisted(() => vi.fn());
const createRelocationMock = vi.hoisted(() => vi.fn());
const startCountingMock = vi.hoisted(() => vi.fn());
const reconcileMock = vi.hoisted(() => vi.fn());
const closeMock = vi.hoisted(() => vi.fn());
const cancelDocMock = vi.hoisted(() => vi.fn());
const routerPushMock = vi.hoisted(() => vi.fn());
const notifySuccessMock = vi.hoisted(() => vi.fn());
const notifyErrorMock = vi.hoisted(() => vi.fn());

var authStoreState: {
    currentCompanyId: string | null;
    permissions: Array<{
        menuCode: string;
        actions: {
            canView: boolean;
            canCreate: boolean;
            canUpdate: boolean;
            canDelete: boolean;
        };
    }>;
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
        permissions: [
            {
                menuCode: "TRANSACTION_OPNAME",
                actions: {
                    canView: true,
                    canCreate: true,
                    canUpdate: true,
                    canDelete: true,
                },
            },
        ],
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
        createRelocation: createRelocationMock,
        startCounting: startCountingMock,
        reconcile: reconcileMock,
        close: closeMock,
        cancel: cancelDocMock,
    },
}));

vi.mock("@/services/location.service", () => ({
    locationService: {
        list: vi.fn().mockResolvedValue({ data: { items: [] } }),
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
        authStoreState.permissions[0].actions = {
            canView: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
        };

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
                status: "counting",
                nodeType: "task",
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
            "adjust",
            "relocation",
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

    it("submits adjust through line-count and relocation through its transaction endpoint", async () => {
        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        detail.openDetail(detail.selectedDetailLines.value[0]);
        detail.selectItemAction("adjust");
        detail.activeActionForm.value.actualQty = "8";
        detail.activeActionForm.value.reason = "Physical correction";
        await detail.submitItemAction();

        expect(updateLineCountMock).toHaveBeenLastCalledWith(
            "root-1",
            "line-1",
            {
                qtyCounted: 8,
                notes: "Adjust | Reason: Physical correction",
            },
        );

        detail.openDetail(detail.selectedDetailLines.value[0]);
        detail.selectItemAction("relocation");
        detail.activeActionForm.value.actualQty = "6";
        detail.activeActionForm.value.reason = "Moved to rack B";
        detail.activeActionForm.value.destinationWarehouseId = "wh-1";
        detail.activeActionForm.value.destinationLocationId = "loc-b";
        await detail.submitItemAction();

        expect(createRelocationMock).toHaveBeenLastCalledWith(
            "root-1",
            "line-1",
            {
                toWarehouseId: "wh-1",
                toLocationId: "loc-b",
                qty: 6,
                notes: "Relocation | Reason: Moved to rack B",
            },
        );
    });

    it("blocks adjustment outside counting status", async () => {
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
                status: "reconciled",
                nodeType: "task",
                children: [],
            },
        ]);

        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();
        detail.openDetail(detail.selectedDetailLines.value[0]);
        detail.selectItemAction("adjust");
        detail.activeActionForm.value.actualQty = "8";
        detail.activeActionForm.value.reason = "Physical correction";

        await detail.submitItemAction();

        expect(updateLineCountMock).not.toHaveBeenCalled();
        expect(notifyErrorMock).toHaveBeenCalledWith(
            "Adjustment hanya dapat dilakukan saat opname berstatus counting dan user memiliki permission update.",
        );
    });

    it("rejects an adjustment without a valid quantity or reason", async () => {
        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();
        detail.openDetail(detail.selectedDetailLines.value[0]);
        detail.selectItemAction("adjust");

        await detail.submitItemAction();

        expect(updateLineCountMock).not.toHaveBeenCalled();
        expect(notifyErrorMock).toHaveBeenCalledWith(
            "Actual Qty adjustment wajib berupa angka nol atau lebih.",
        );

        detail.activeActionForm.value.actualQty = "8";
        await detail.submitItemAction();

        expect(updateLineCountMock).not.toHaveBeenCalled();
        expect(notifyErrorMock).toHaveBeenCalledWith(
            "Reason adjustment wajib diisi.",
        );
    });

    it("blocks adjustment when the user lacks opname update permission", async () => {
        authStoreState.permissions[0].actions.canUpdate = false;
        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();
        detail.openDetail(detail.selectedDetailLines.value[0]);
        detail.selectItemAction("adjust");
        detail.activeActionForm.value.actualQty = "8";
        detail.activeActionForm.value.reason = "Physical correction";

        await detail.submitItemAction();

        expect(updateLineCountMock).not.toHaveBeenCalled();
        expect(notifyErrorMock).toHaveBeenCalledWith(
            "Adjustment hanya dapat dilakukan saat opname berstatus counting dan user memiliki permission update.",
        );
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
                status: "posted",
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
                nodeType: "group",
                children: [],
            },
        ]);
        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        // Group nodes do not support document-level lifecycle actions.
        expect(detail.canStartCounting.value).toBe(false);
        expect(detail.canReconcile.value).toBe(false);
        expect(detail.canClose.value).toBe(false);
        expect(detail.canCancelDoc.value).toBe(false);
    });

    it("runs lifecycle actions for all matching child task nodes", async () => {
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
                nodeType: "group",
                children: [
                    {
                        id: "task-1",
                        parentId: "root-1",
                        companyId: "company-1",
                        warehouse_id: "wh-1",
                        profile_id: "OP-TASK-1",
                        title: "Task 1",
                        description: null,
                        task_group: null,
                        task_period: null,
                        status: "counting",
                        nodeType: "task",
                        children: [],
                    },
                    {
                        id: "task-2",
                        parentId: "root-1",
                        companyId: "company-1",
                        warehouse_id: "wh-1",
                        profile_id: "OP-TASK-2",
                        title: "Task 2",
                        description: null,
                        task_group: null,
                        task_period: null,
                        status: "counting",
                        nodeType: "task",
                        children: [],
                    },
                ],
            },
        ]);
        reconcileMock.mockResolvedValue(undefined);

        const detail = useOpnameDetail();
        await nextTick();
        await Promise.resolve();

        expect(detail.canReconcile.value).toBe(true);
        detail.handleReconcile();
        await detail.handleConfirmDocAction();

        expect(reconcileMock).toHaveBeenCalledTimes(2);
        expect(reconcileMock).toHaveBeenNthCalledWith(1, "task-1");
        expect(reconcileMock).toHaveBeenNthCalledWith(2, "task-2");
        expect(notifySuccessMock).toHaveBeenCalledWith(
            "Reconcile Opname succeeded for 2 task(s).",
        );
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
                status: "posted",
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
            "Start Counting succeeded for 1 task(s).",
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
