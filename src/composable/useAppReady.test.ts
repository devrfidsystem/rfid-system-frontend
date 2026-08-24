import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MIN_DISPLAY_MS, useAppReady } from "./useAppReady";

describe("useAppReady", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("stays false until the router reports ready AND the minimum display time has elapsed", async () => {
        let resolveReady: () => void = () => {};
        const readyPromise = new Promise<void>((resolve) => {
            resolveReady = resolve;
        });
        const fakeRouter = { isReady: () => readyPromise };

        const appReady = useAppReady(fakeRouter);

        expect(appReady.value).toBe(false);

        resolveReady();
        await readyPromise;
        await vi.advanceTimersByTimeAsync(0);

        expect(appReady.value).toBe(false);

        await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS - 1);
        expect(appReady.value).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        expect(appReady.value).toBe(true);
    });

    it("flips true as soon as the router is ready if the minimum display time already elapsed", async () => {
        let resolveReady: () => void = () => {};
        const readyPromise = new Promise<void>((resolve) => {
            resolveReady = resolve;
        });
        const fakeRouter = { isReady: () => readyPromise };

        const appReady = useAppReady(fakeRouter);

        await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS + 500);
        expect(appReady.value).toBe(false);

        resolveReady();
        await readyPromise;
        await vi.advanceTimersByTimeAsync(0);

        expect(appReady.value).toBe(true);
    });

    it("never flips true if the router never resolves", async () => {
        const foreverPending = new Promise<void>(() => {});
        const fakeRouter = { isReady: () => foreverPending };

        const appReady = useAppReady(fakeRouter);
        await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS + 1000);

        expect(appReady.value).toBe(false);
    });

    it("flips true even if the router's isReady rejects, after the minimum display time", async () => {
        let rejectReady: () => void = () => {};
        const readyPromise = new Promise<void>((_resolve, reject) => {
            rejectReady = reject;
        });
        const fakeRouter = { isReady: () => readyPromise };

        const appReady = useAppReady(fakeRouter);
        expect(appReady.value).toBe(false);

        rejectReady();
        await readyPromise.catch(() => {});
        await vi.advanceTimersByTimeAsync(MIN_DISPLAY_MS - 1);
        expect(appReady.value).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        expect(appReady.value).toBe(true);
    });
});
