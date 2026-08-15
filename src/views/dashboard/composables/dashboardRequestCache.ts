interface CacheEntry<T> {
    data: T;
    createdAt: number;
}

interface LoadOptions {
    force?: boolean;
}

interface DashboardRequestCacheOptions {
    ttlMs?: number;
    now?: () => number;
}

interface LoadResult<T> {
    data: T;
    fromCache: boolean;
}

const DEFAULT_TTL_MS = 30000;

export function createDashboardRequestCache(
    options: DashboardRequestCacheOptions = {},
) {
    const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    const now = options.now ?? Date.now;
    const cachedResponses = new Map<string, CacheEntry<unknown>>();
    const inFlightRequests = new Map<string, Promise<LoadResult<unknown>>>();
    const latestSequences = new Map<string, number>();

    const isFresh = (entry: CacheEntry<unknown>) =>
        now() - entry.createdAt <= ttlMs;

    return {
        load<T>(
            key: string,
            fetcher: () => Promise<T>,
            loadOptions: LoadOptions = {},
        ): Promise<LoadResult<T>> {
            const cached = cachedResponses.get(key);
            if (!loadOptions.force && cached && isFresh(cached)) {
                return Promise.resolve({
                    data: cached.data as T,
                    fromCache: true,
                });
            }

            const inFlight = inFlightRequests.get(key);
            if (!loadOptions.force && inFlight) {
                return inFlight as Promise<LoadResult<T>>;
            }

            const request = fetcher()
                .then((data) => {
                    cachedResponses.set(key, { data, createdAt: now() });
                    return { data, fromCache: false };
                })
                .finally(() => {
                    if (inFlightRequests.get(key) === request) {
                        inFlightRequests.delete(key);
                    }
                });

            inFlightRequests.set(key, request);
            return request;
        },

        clear() {
            cachedResponses.clear();
            inFlightRequests.clear();
            latestSequences.clear();
        },

        nextSequence(scope: string) {
            const next = (latestSequences.get(scope) ?? 0) + 1;
            latestSequences.set(scope, next);
            return next;
        },

        isLatest(scope: string, sequence: number) {
            return latestSequences.get(scope) === sequence;
        },
    };
}

export const dashboardRequestCache = createDashboardRequestCache();
