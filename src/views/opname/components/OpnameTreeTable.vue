<template>
    <div>
        <div v-if="loading" class="space-y-3 px-6 py-4">
            <SkeletonBlock
                v-for="n in 5"
                :key="`opname-skeleton-${n}`"
                height="h-4"
                :width="n % 2 === 0 ? 'w-5/6' : 'w-full'"
            />
        </div>

        <div v-else-if="!rows.length" class="px-6 py-8">
            <EmptyState
                :variant="emptyStateVariant"
                title="No opname nodes"
                description="No stock opname nodes are available for the selected warehouse."
                size="sm"
            />
        </div>

        <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
                <thead>
                    <tr
                        class="bg-surface-secondary text-left text-xs font-semibold text-text-secondary"
                    >
                        <th class="px-6 py-3 text-left">Groups</th>
                        <th class="px-6 py-3 text-left">Date</th>
                        <th class="px-6 py-3 text-left">Status</th>
                        <th class="px-6 py-3 text-left">Location</th>
                        <th class="px-6 py-3 text-left">Detail</th>
                        <th class="px-6 py-3 text-left">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border bg-surface">
                    <tr
                        v-for="row in rows"
                        :key="row.id"
                        class="hover:bg-surface-secondary text-sm text-text transition-colors duration-150"
                    >
                        <td class="px-6 py-3 align-top">
                            <div
                                class="flex items-start gap-2"
                                :style="{ paddingLeft: `${row.depth * 24}px` }"
                            >
                                <button
                                    v-if="row.hasChildren"
                                    type="button"
                                    class="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-text-secondary transition-colors duration-150 hover:text-text"
                                    @click="$emit('toggle-expand', row.id)"
                                >
                                    <Icon
                                        :icon="
                                            row.expanded
                                                ? ChevronDown
                                                : ChevronRight
                                        "
                                        :size="12"
                                    />
                                </button>
                                <div
                                    v-else
                                    class="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center text-text-secondary"
                                >
                                    <span class="text-xs">•</span>
                                </div>
                                <div class="min-w-0">
                                    <div class="font-medium text-text">
                                        {{ row.title }}
                                    </div>
                                    <div class="text-xs text-text-secondary">
                                        {{ row.profile_id }} ·
                                        {{ row.nodeType }}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-3 align-top text-text-secondary">
                            {{ formatDate(row.createdAt) }}
                        </td>
                        <td class="px-6 py-3 align-top">
                            <Badge :tone="statusTone(row.status)">
                                {{ statusLabel(row.status) }}
                            </Badge>
                        </td>
                        <td class="px-6 py-3 align-top text-text-secondary">
                            {{ locationLabel(row) }}
                        </td>
                        <td class="px-6 py-3 align-top">
                            <button
                                type="button"
                                class="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
                                @click="$emit('view-node', row)"
                            >
                                <span>Open</span>
                            </button>
                        </td>
                        <td class="px-6 py-3 align-top">
                            <div
                                v-if="row.nodeType === 'group'"
                                class="flex flex-wrap gap-2"
                            >
                                <Button
                                    size="sm"
                                    variant="outline"
                                    object-id="btn_OpnameTreeNewProfile"
                                    @click="$emit('new-profile', row)"
                                >
                                    New Profile
                                </Button>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    object-id="btn_OpnameTreeNewTask"
                                    @click="$emit('new-task', row)"
                                >
                                    New Task
                                </Button>
                            </div>
                            <div
                                v-else-if="row.nodeType === 'profile'"
                                class="flex flex-wrap gap-2"
                            >
                                <Button
                                    size="sm"
                                    variant="primary"
                                    object-id="btn_OpnameTreeNewTask"
                                    @click="$emit('new-task', row)"
                                >
                                    New Task
                                </Button>
                            </div>
                            <div v-else class="text-xs text-text-secondary">
                                Task node
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-if="!loading && rows.length"
            class="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-3 text-sm text-text-secondary"
        >
            <p>
                Showing <span class="font-medium text-text">1</span> -
                <span class="font-medium text-text">{{ rows.length }}</span>
                of
                <span class="font-medium text-text">{{ rows.length }}</span>
                records
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from "@/components/atoms/Button.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { ChevronDown, ChevronRight } from "lucide-vue-next";
import type { OpnameTreeRow } from "../opnameTree";

defineProps<{
    rows: OpnameTreeRow[];
    loading: boolean;
    emptyStateVariant: "default" | "search" | "filter";
}>();

defineEmits<{
    (e: "toggle-expand", id: string): void;
    (e: "new-profile", row: OpnameTreeRow): void;
    (e: "new-task", row: OpnameTreeRow): void;
    (e: "view-node", row: OpnameTreeRow): void;
}>();

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const statusLabel = (value: string) => {
    if (value === "counting") return "On Going";
    if (value === "closed") return "Closed";
    return "Draft";
};

const statusTone = (value: string) => {
    if (value === "counting") {
        return "warning";
    }
    if (value === "closed") {
        return "success";
    }
    return "neutral";
};

const locationLabel = (row: OpnameTreeRow) => {
    const parts = [row.task_group, row.task_period, row.description]
        .filter(Boolean)
        .map(String);
    return parts.length ? parts.join(" · ") : "-";
};
</script>
