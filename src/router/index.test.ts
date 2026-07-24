import { describe, expect, it } from "vitest";
// @ts-expect-error Vite raw imports are resolved at test runtime.
import routerSource from "./index.ts?raw";

describe("transaction routes", () => {
    it("keeps opname on the dedicated route flow instead of the generic transaction pattern", () => {
        expect(routerSource).toContain('path: "transactions/opname"');
        expect(routerSource).toContain('path: "transactions/opname/new"');
        expect(routerSource).toContain('path: "transactions/opname/:id"');
        expect(routerSource).toContain("const genericTransactionKeys");
        expect(routerSource).not.toContain(
            '"opname",\n] as const;\nconst transactionPattern',
        );
    });
});
