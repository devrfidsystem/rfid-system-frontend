export type LocationPickerLocation = {
    id: string;
    parentId?: string | null;
    code: string;
    name: string;
    epc?: string | null;
};

export type LocationPickerRow = LocationPickerLocation & {
    depth: number;
    selectable: boolean;
    isLeaf: boolean;
    children: LocationPickerRow[];
};

const isTagged = (location: LocationPickerLocation) =>
    Boolean(location.epc?.trim());

const isLeaf = (
    location: LocationPickerLocation,
    locations: LocationPickerLocation[],
) => locations.every((candidate) => candidate.parentId !== location.id);

export const taggedDescendantLeafIds = (
    id: string,
    locations: LocationPickerLocation[],
): string[] => {
    const children = locations.filter((location) => location.parentId === id);
    if (children.length === 0) {
        const self = locations.find((location) => location.id === id);
        return self && isTagged(self) && isLeaf(self, locations) ? [id] : [];
    }
    return children.flatMap((child) =>
        taggedDescendantLeafIds(child.id, locations),
    );
};

export const buildLocationPickerRows = (
    locations: LocationPickerLocation[],
): LocationPickerRow[] => {
    const byParent = new Map<string | null, LocationPickerLocation[]>();
    locations.forEach((location) => {
        const key = location.parentId ?? null;
        const group = byParent.get(key) ?? [];
        group.push(location);
        byParent.set(key, group);
    });

    const sortByCode = (a: LocationPickerLocation, b: LocationPickerLocation) =>
        a.code.localeCompare(b.code, undefined, { numeric: true });

    const walk = (
        parentId: string | null,
        depth: number,
    ): LocationPickerRow[] => {
        const nodes = [...(byParent.get(parentId) ?? [])].sort(sortByCode);
        return nodes.map((location) => {
            const children = walk(location.id, depth + 1);
            const leaf = children.length === 0;
            return {
                ...location,
                depth,
                isLeaf: leaf,
                selectable: leaf ? isTagged(location) : false,
                children,
            };
        });
    };

    return walk(null, 0);
};

export const toggleParent = (
    id: string,
    selected: string[],
    locations: LocationPickerLocation[],
): string[] => {
    const leafIds = taggedDescendantLeafIds(id, locations);
    const selectedSet = new Set(selected);
    const allSelected = leafIds.every((leafId) => selectedSet.has(leafId));
    if (allSelected) {
        leafIds.forEach((leafId) => selectedSet.delete(leafId));
    } else {
        leafIds.forEach((leafId) => selectedSet.add(leafId));
    }
    return [...selectedSet];
};

export const toggleLeaf = (id: string, selected: string[]): string[] => {
    const selectedSet = new Set(selected);
    if (selectedSet.has(id)) selectedSet.delete(id);
    else selectedSet.add(id);
    return [...selectedSet];
};

export const flattenLocationPickerRows = (
    rows: LocationPickerRow[],
): LocationPickerRow[] =>
    rows.flatMap((row) => [row, ...flattenLocationPickerRows(row.children)]);

export const parentCheckState = (
    id: string,
    selected: string[],
    locations: LocationPickerLocation[],
): "checked" | "unchecked" | "indeterminate" => {
    const leafIds = taggedDescendantLeafIds(id, locations);
    if (leafIds.length === 0) return "unchecked";
    const selectedCount = leafIds.filter((leafId) =>
        selected.includes(leafId),
    ).length;
    if (selectedCount === 0) return "unchecked";
    if (selectedCount === leafIds.length) return "checked";
    return "indeterminate";
};
