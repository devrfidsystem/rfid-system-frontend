import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, type EffectScope } from "vue";
import { useOpnameTree } from "./useOpnameTree";

let activeScope: EffectScope | undefined;

function mountOpnameTree() {
    activeScope = effectScope();
    return activeScope.run(() => useOpnameTree())!;
}

const getTreeMock = vi.hoisted(() => vi.fn());
const getSummaryMock = vi.hoisted(() => vi.fn());
var authStoreState: {
    currentCompanyId: string | null;
    setProfile: (profile: { currentCompanyId?: string | null }) => void;
};
var warehouseOptionsRef: {
    value: { id: string; code: string; name: string }[];
};

vi.mock("@/store/auth.store", async () => {
    const { reactive } = await import("vue");
    authStoreState = reactive({
        currentCompanyId: null as string | null,
        setProfile(profile: { currentCompanyId?: string | null }) {
            this.currentCompanyId = profile.currentCompanyId ?? null;
        },
    });
    return {
        useAuthStore: () => authStoreState,
    };
});

vi.mock("@/services/opname.service", () => ({
    opnameService: {
        getTree: getTreeMock,
        summary: getSummaryMock,
        post: vi.fn(),
    },
}));

vi.mock("@/composable/useNotifier", () => ({
    useNotifier: () => ({
        notifyError: vi.fn(),
        notifySuccess: vi.fn(),
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
    return {
        ...actual,
        useRoute: () => ({ query: {} }),
        useRouter: () => ({
            push: vi.fn(),
        }),
    };
});

describe("useOpnameTree", () => {
    beforeEach(() => {
        getTreeMock.mockReset();
        getTreeMock.mockResolvedValue([]);
        getSummaryMock.mockReset();
        getSummaryMock.mockResolvedValue({
            totalCount: 0,
            statusBreakdown: [],
            varianceTaskCount: 0,
            needsAttention: {
                count: 0,
                canceledCount: 0,
                stuckCountingCount: 0,
            },
            mostRecent: null,
        });
        warehouseOptionsRef.value = [
            { id: "wh-1", code: "WH1", name: "Main Warehouse" },
        ];
        authStoreState.currentCompanyId = null;
    });

    afterEach(() => {
        activeScope?.stop();
        activeScope = undefined;
    });

    it("reloads the tree when company context becomes available after warehouse options are ready", async () => {
        mountOpnameTree();
        await nextTick();

        expect(getTreeMock).not.toHaveBeenCalled();

        authStoreState.setProfile({ currentCompanyId: "company-1" });
        await nextTick();
        await Promise.resolve();

        expect(getTreeMock).toHaveBeenCalledTimes(1);
        expect(getTreeMock).toHaveBeenCalledWith({
            companyId: "company-1",
            warehouseId: "wh-1",
        });
    });

    it("fetches the summary alongside the tree once company and warehouse are available", async () => {
        const composable = mountOpnameTree();
        await nextTick();

        authStoreState.setProfile({ currentCompanyId: "company-1" });
        await nextTick();
        await Promise.resolve();

        expect(getSummaryMock).toHaveBeenCalledTimes(1);
        expect(getSummaryMock).toHaveBeenCalledWith({
            companyId: "company-1",
            warehouseId: "wh-1",
        });
        expect(composable.summary.value).toEqual({
            totalCount: 0,
            statusBreakdown: [],
            varianceTaskCount: 0,
            needsAttention: {
                count: 0,
                canceledCount: 0,
                stuckCountingCount: 0,
            },
            mostRecent: null,
        });
    });

    it("isolates a summary fetch failure from the tree's own rows/error state", async () => {
        getSummaryMock.mockRejectedValueOnce(new Error("Summary down"));
        getTreeMock.mockResolvedValueOnce([
            {
                id: "task-1",
                parentId: null,
                companyId: "company-1",
                warehouse_id: "wh-1",
                profile_id: "OP-1",
                title: "Task 1",
                description: null,
                task_group: null,
                task_period: null,
                status: "draft",
                nodeType: "task",
            },
        ]);

        const composable = mountOpnameTree();
        await nextTick();

        authStoreState.setProfile({ currentCompanyId: "company-1" });
        await nextTick();
        await Promise.resolve();

        expect(composable.summaryError.value).toBe("Summary down");
        expect(composable.error.value).toBeNull();
        expect(composable.rows.value).toHaveLength(1);
    });

    it("isolates a tree fetch failure from the summary's own state", async () => {
        getTreeMock.mockRejectedValueOnce(new Error("Tree down"));
        const mockSummary = {
            totalCount: 2,
            statusBreakdown: [
                { status: "counting", count: 2, percentage: 100 },
            ],
            varianceTaskCount: 0,
            needsAttention: {
                count: 0,
                canceledCount: 0,
                stuckCountingCount: 0,
            },
            mostRecent: null,
        };
        getSummaryMock.mockResolvedValueOnce(mockSummary);

        const composable = mountOpnameTree();
        await nextTick();

        authStoreState.setProfile({ currentCompanyId: "company-1" });
        await nextTick();
        await Promise.resolve();

        expect(composable.error.value).toBe("Tree down");
        expect(composable.summaryError.value).toBeNull();
        expect(composable.summary.value).toEqual(mockSummary);
    });

    it("expands nested task rows after the tree API returns a nested payload", async () => {
        getTreeMock.mockResolvedValueOnce([
            {
                id: "root-1",
                parentId: null,
                companyId: "company-1",
                warehouse_id: "wh-1",
                profile_id: "OP-ROOT",
                title: "2026",
                description: null,
                task_group: null,
                task_period: null,
                status: "draft",
                nodeType: "group",
                children: [
                    {
                        id: "profile-1",
                        parentId: "root-1",
                        companyId: "company-1",
                        warehouse_id: "wh-1",
                        profile_id: "OP-PROFILE",
                        title: "Q1",
                        description: null,
                        task_group: null,
                        task_period: null,
                        status: "draft",
                        nodeType: "profile",
                        children: [
                            {
                                id: "task-1",
                                parentId: "profile-1",
                                companyId: "company-1",
                                warehouse_id: "wh-1",
                                profile_id: "OP-TASK",
                                title: "Floor A",
                                description: null,
                                task_group: null,
                                task_period: null,
                                status: "draft",
                                nodeType: "task",
                            },
                        ],
                    },
                ],
            },
        ]);

        const composable = mountOpnameTree();
        await nextTick();
        authStoreState.setProfile({ currentCompanyId: "company-1" });
        await nextTick();
        await Promise.resolve();

        expect(composable.rows.value.map((row) => row.id)).toEqual([
            "root-1",
            "profile-1",
            "task-1",
        ]);
    });

    it("does not refetch the summary when a client-side filter changes", async () => {
        const composable = mountOpnameTree();
        await nextTick();

        authStoreState.setProfile({ currentCompanyId: "company-1" });
        await nextTick();
        await Promise.resolve();

        expect(getSummaryMock).toHaveBeenCalledTimes(1);
        getSummaryMock.mockClear();

        composable.keyword.value = "search term";
        composable.statusFilter.value = "counting";
        composable.locationFilter.value = "Rack A";
        composable.startDate.value = "2026-08-01";
        composable.endDate.value = "2026-08-06";
        await nextTick();
        await Promise.resolve();

        expect(getSummaryMock).not.toHaveBeenCalled();
    });
});
