<template>
    <div class="space-y-1">
        <p class="text-sm font-medium text-text-secondary">Locations</p>
        <div
            class="max-h-72 overflow-auto rounded-md border border-border bg-surface"
        >
            <p
                v-if="!flatRows.length"
                class="px-3 py-3 text-sm text-text-muted"
            >
                No locations in this warehouse.
            </p>
            <label
                v-for="row in flatRows"
                :key="row.id"
                class="flex items-center gap-2 py-1.5 pr-3 text-sm text-text"
                :style="{ paddingLeft: `${12 + row.depth * 16}px` }"
            >
                <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-border"
                    :checked="isChecked(row)"
                    :disabled="row.isLeaf && !row.selectable"
                    :indeterminate="isIndeterminate(row)"
                    @change="onToggle(row)"
                />
                <span class="min-w-0 truncate">
                    {{ row.code }} · {{ row.name }}
                </span>
                <span
                    v-if="row.isLeaf && !row.selectable"
                    class="text-xs text-text-muted"
                >
                    No RFID
                </span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
    buildLocationPickerRows,
    flattenLocationPickerRows,
    parentCheckState,
    toggleLeaf,
    toggleParent,
    type LocationPickerLocation,
    type LocationPickerRow,
} from "../opnameLocationPicker";

const props = defineProps<{
    locations: LocationPickerLocation[];
    selectedIds: string[];
}>();

const emit = defineEmits<{
    (e: "update:selectedIds", value: string[]): void;
}>();

const flatRows = computed(() =>
    flattenLocationPickerRows(buildLocationPickerRows(props.locations)),
);

const isChecked = (row: LocationPickerRow) => {
    if (row.isLeaf) return props.selectedIds.includes(row.id);
    return parentCheckState(row.id, props.selectedIds, props.locations) === "checked";
};

const isIndeterminate = (row: LocationPickerRow) =>
    !row.isLeaf &&
    parentCheckState(row.id, props.selectedIds, props.locations) ===
        "indeterminate";

const onToggle = (row: LocationPickerRow) => {
    if (row.isLeaf) {
        if (!row.selectable) return;
        emit("update:selectedIds", toggleLeaf(row.id, props.selectedIds));
        return;
    }
    emit(
        "update:selectedIds",
        toggleParent(row.id, props.selectedIds, props.locations),
    );
};
</script>
