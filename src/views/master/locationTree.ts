import type { MasterRecord } from "./types";

type LabelMap = Map<string, string>;
type TreeIdSet = ReadonlySet<string> | Set<string>;

const normalizeLabel = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

const getWarehouseLabel = (
    row: MasterRecord,
    warehouseLabels: LabelMap,
) => {
    const relationName = normalizeLabel(row.warehouse?.name);
    if (relationName) return relationName;

    const mapped = warehouseLabels.get(String(row.warehouseId ?? ""));
    if (mapped) return mapped;

    return "";
};

const getLocationName = (row: MasterRecord) =>
    normalizeLabel(row.name) || normalizeLabel(row.code);

const getLocationTreeChildren = (
    row: MasterRecord,
    childrenByParentId: Map<string, MasterRecord[]>,
) => {
    if (!row.id) return [];
    return childrenByParentId.get(String(row.id)) ?? [];
};

export const resolveLocationWarehouseLabel = (
    row: MasterRecord,
    warehouseLabels: LabelMap,
) => getWarehouseLabel(row, warehouseLabels);

export const resolveLocationParentLabel = (
    row: MasterRecord,
    rowsById: Map<string, MasterRecord>,
) => {
    const parent = row.parent ?? rowsById.get(String(row.parentId ?? ""));
    return parent ? getLocationName(parent) : "";
};

export const buildLocationPathLabel = (
    row: MasterRecord,
    rowsById: Map<string, MasterRecord>,
    warehouseLabels: LabelMap,
) => {
    const parts: string[] = [];
    const warehouseLabel = getWarehouseLabel(row, warehouseLabels);
    if (warehouseLabel) {
        parts.push(warehouseLabel);
    }

    const chain: string[] = [];
    const visited = new Set<string>();
    let current: MasterRecord | undefined = row;

    while (current) {
        const currentId = String(current.id ?? "");
        if (!currentId || visited.has(currentId)) break;
        visited.add(currentId);

        const currentName = getLocationName(current);
        if (currentName) {
            chain.push(currentName);
        }

        const parentId = String(current.parentId ?? "");
        if (!parentId) break;
        current = rowsById.get(parentId);
    }

    parts.push(...chain.reverse());
    return parts.join(" > ");
};

export const resolveLocationTreeLabel = (row: MasterRecord) =>
    getLocationName(row);

export const buildLocationTreeSubtitle = (
    row: MasterRecord,
    rowsById: Map<string, MasterRecord>,
    warehouseLabels: LabelMap,
) => {
    const parts: string[] = [];
    const warehouseLabel = getWarehouseLabel(row, warehouseLabels);
    if (warehouseLabel) {
        parts.push(warehouseLabel);
    }

    const parentLabel = resolveLocationParentLabel(row, rowsById);
    if (parentLabel) {
        parts.push(`Parent: ${parentLabel}`);
    }

    return parts.join(" • ");
};

export const buildLocationTreeRows = (
    rows: MasterRecord[],
    expandedIds: TreeIdSet,
) => {
    const rowsById = new Map<string, MasterRecord>();
    const childrenByParentId = new Map<string, MasterRecord[]>();

    rows.forEach((row) => {
        const id = String(row.id ?? "");
        if (id) {
            rowsById.set(id, row);
        }
    });

    rows.forEach((row) => {
        const parentId = String(row.parentId ?? "");
        const parentExists = parentId && rowsById.has(parentId);
        const key = parentExists ? parentId : "";
        const bucket = childrenByParentId.get(key) ?? [];
        bucket.push(row);
        childrenByParentId.set(key, bucket);
    });

    const orderedRows: MasterRecord[] = [];
    const visited = new Set<string>();

    const appendSiblings = (
        siblings: MasterRecord[],
        treeDepth: number,
        treeGuides: boolean[] = [],
    ) => {
        siblings.forEach((row, index) => {
            const id = String(row.id ?? "");
            if (!id || visited.has(id)) return;
            visited.add(id);

            const children = getLocationTreeChildren(row, childrenByParentId);
            const treeHasChildren = children.length > 0;
            const treeExpanded = treeHasChildren && expandedIds.has(id);
            const hasNextSibling = index < siblings.length - 1;

            orderedRows.push({
                ...row,
                treeDepth,
                treeHasChildren,
                treeExpanded,
                treeLabel: getLocationName(row),
                treeGuides,
            });

            if (!treeExpanded) return;
            appendSiblings(children, treeDepth + 1, [
                ...treeGuides,
                hasNextSibling,
            ]);
        });
    };

    appendSiblings(childrenByParentId.get("") ?? [], 0, []);

    rows.forEach((row) => {
        const id = String(row.id ?? "");
        if (id && !visited.has(id)) {
            appendSiblings([row], 0, []);
        }
    });

    return orderedRows;
};
