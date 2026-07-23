import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { useOpnameDetail } from "./useOpnameDetail";

const getTreeMock = vi.hoisted(() => vi.fn());
const getDetailMock = vi.hoisted(() => vi.fn());
const updateLineCountMock = vi.hoisted(() => vi.fn());
const routerPushMock = vi.hoisted(() => vi.fn());
const notifySuccessMock = vi.hoisted(() => vi.fn());

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
    },
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        notifySuccess: notifySuccessMock,
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
        routerPushMock.mockReset();
        notifySuccessMock.mockReset();

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
});
