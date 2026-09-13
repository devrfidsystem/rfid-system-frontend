/**
 * Resolves a (possibly dotted) path against an object, traversing nested
 * objects one segment at a time. Returns `undefined` if any segment along
 * the path is missing or not an object.
 *
 * Examples:
 *   getNestedValue({ status: "draft" }, "status") -> "draft"
 *   getNestedValue({ registeredBy: { fullName: "Jane" } }, "registeredBy.fullName") -> "Jane"
 */
export const getNestedValue = (
    obj: Record<string, unknown>,
    path: string,
): unknown => {
    return path
        .split(".")
        .reduce<unknown>(
            (current, segment) =>
                current !== null && typeof current === "object"
                    ? (current as Record<string, unknown>)[segment]
                    : undefined,
            obj,
        );
};
