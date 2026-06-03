import { watch, type WatchSource } from "vue";

export function useDebouncedWatch<T>(
    source: WatchSource<T> | WatchSource<T>[],
    callback: () => void,
    delay = 300,
) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return watch(source, () => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            callback();
            timer = undefined;
        }, delay);
    });
}
