export function toObjectId(prefix: string, label: string): string {
    if (!label) return "";
    // Remove non-alphanumeric except spaces and underscores
    const cleanLabel = label.replace(/[^a-zA-Z0-9\s_]/g, "");

    // Convert to PascalCase
    const pascalCase = cleanLabel
        .split(/[\s_]+/)
        .filter((word) => word.length > 0)
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");

    return `${prefix}${pascalCase}`;
}

export function bindObjectId(objectId?: string) {
    if (!objectId) return {};
    return {
        id: objectId,
        "data-testid": objectId,
        "object-id": objectId,
    };
}
