import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { useOpnameTree } from "./useOpnameTree";

const getTreeMock = vi.hoisted(() => vi.fn());
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
        warehouseOptionsRef.value = [
            { id: "wh-1", code: "WH1", name: "Main Warehouse" },
        ];
        authStoreState.currentCompanyId = null;
    });

    it("reloads the tree when company context becomes available after warehouse options are ready", async () => {
        useOpnameTree();
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
});
