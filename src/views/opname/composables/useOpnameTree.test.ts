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
    },
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
            needsAttention: { count: 0, canceledCount: 0, stuckCountingCount: 0 },
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
});
