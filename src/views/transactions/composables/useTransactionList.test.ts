import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/composable/useDebouncedWatch", () => ({
    useDebouncedWatch: vi.fn(),
}));

vi.mock("@/composable/useWarehouseOptions", () => ({
    useWarehouseOptions: () => ({
        options: ref([]),
        loading: ref(false),
        error: ref(null),
        refresh: vi.fn(),
    }),
}));

vi.mock("@/services/master.service", () => ({
    masterService: {
        fetchList: vi.fn().mockResolvedValue({ items: [], meta: null }),
    },
}));

vi.mock("@/services/transactions.service", () => ({
    transactionPaths: {
        register: "/register",
        inbound: "/inbound",
        putaway: "/putaway",
        outbound: "/outbound",
        relocation: "/relocation",
        transfer: "/transfer",
        return: "/returns",
        returns: "/returns",
        opname: "/opname",
    },
    transactionService: {
        list: vi.fn().mockResolvedValue({ items: [], meta: null }),
        get: vi.fn(),
        create: vi.fn(),
        post: vi.fn(),
        cancel: vi.fn(),
    },
}));

vi.mock("@/services/report.service", () => ({
    reportService: {
        exportReport: vi.fn(),
    },
}));

vi.mock("@/views/report/reportConfig", () => ({
    reportConfigs: {
        relocation: {
            title: "Relocation Transactions",
            description: "See inventory movements between locations (/relocation).",
            columns: [],
        },
    },
    hasPartnerDatasetSupport: () => false,
}));

describe("useTransactionList", () => {
    it("renders relocation list metadata and create entrypoint", async () => {
        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        expect(list.pageTitle.value).toBe("Relocation Transactions");
        expect(list.pageTagline.value).toBe("Transactions");
        expect(list.sectionHeading.value).toBe("Relocation Transactions");
        expect(list.pageDescription.value).toBe(
            "See inventory movements between locations (/relocation). · powered by /relocation",
        );
    });
});
