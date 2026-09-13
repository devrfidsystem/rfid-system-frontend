import { describe, expect, it } from "vitest";
import {
    formatTransactionStatus,
    getTransactionStatusTone,
} from "./transactionStatus";

describe("transactionStatus", () => {
    it.each([
        ["draft", "warning"],
        ["pending", "warning"],
        ["processing", "warning"],
        ["queued", "warning"],
        ["counting", "warning"],
        ["assigned", "warning"],
        ["in_progress", "warning"],
        ["posted", "info"],
        ["dispatched", "info"],
        ["partial", "teal"],
        ["done", "success"],
        ["completed", "success"],
        ["closed", "success"],
        ["reconciled", "success"],
        ["approved", "success"],
        ["success", "success"],
        ["canceled", "error"],
        ["cancelled", "error"],
        ["failed", "error"],
        ["error", "error"],
        ["rejected", "error"],
        ["void", "error"],
        ["voided", "error"],
        ["unexpected", "neutral"],
        [null, "neutral"],
        [undefined, "neutral"],
    ] as const)("maps %s to %s", (status, tone) => {
        expect(getTransactionStatusTone(status)).toBe(tone);
    });

    it("formats backend status values for display", () => {
        expect(formatTransactionStatus("in_progress")).toBe("In Progress");
        expect(formatTransactionStatus("waiting-pick")).toBe("Waiting Pick");
        expect(formatTransactionStatus("posted")).toBe("Posted");
        expect(formatTransactionStatus(null)).toBe("-");
    });
});
