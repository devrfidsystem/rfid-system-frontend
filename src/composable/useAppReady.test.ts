import { describe, expect, it } from "vitest";
import { useAppReady } from "./useAppReady";

describe("useAppReady", () => {
    it("stays false until the router reports ready, then flips true", async () => {
        let resolveReady: () => void = () => {};
        const readyPromise = new Promise<void>((resolve) => {
            resolveReady = resolve;
        });
        const fakeRouter = { isReady: () => readyPromise };

        const appReady = useAppReady(fakeRouter);

        expect(appReady.value).toBe(false);

        resolveReady();
        await readyPromise;
        await Promise.resolve();

        expect(appReady.value).toBe(true);
    });

    it("never flips true if the router never resolves", async () => {
        const foreverPending = new Promise<void>(() => {});
        const fakeRouter = { isReady: () => foreverPending };

        const appReady = useAppReady(fakeRouter);
        await Promise.resolve();

        expect(appReady.value).toBe(false);
    });
});
