import { describe, expect, it } from "vitest";
import {
    canRunTransactionAction,
    isTerminalTransactionStatus,
} from "./transactionFlow";

describe("transactionFlow", () => {
    it("keeps register tasks editable and actionable only while draft", () => {
        expect(canRunTransactionAction("register", "draft", "edit")).toBe(true);
        expect(canRunTransactionAction("register", "draft", "post")).toBe(true);
        expect(canRunTransactionAction("register", "posted", "edit")).toBe(
            false,
        );
        expect(canRunTransactionAction("register", "posted", "post")).toBe(
            false,
        );
    });

    it("models putaway as draft to posted to done", () => {
        expect(canRunTransactionAction("putaway", "draft", "post")).toBe(true);
        expect(canRunTransactionAction("putaway", "posted", "complete")).toBe(
            true,
        );
        expect(canRunTransactionAction("putaway", "done", "complete")).toBe(
            false,
        );
    });

    it("keeps normal stock documents read-only after posting", () => {
        for (const key of ["inbound", "outbound", "relocation"] as const) {
            expect(canRunTransactionAction(key, "draft", "post")).toBe(true);
            expect(canRunTransactionAction(key, "posted", "post")).toBe(false);
            expect(canRunTransactionAction(key, "posted", "cancel")).toBe(
                false,
            );
        }
    });

    it("identifies terminal statuses for list/task cleanup decisions", () => {
        expect(isTerminalTransactionStatus("posted")).toBe(true);
        expect(isTerminalTransactionStatus("done")).toBe(true);
        expect(isTerminalTransactionStatus("draft")).toBe(false);
    });
});
