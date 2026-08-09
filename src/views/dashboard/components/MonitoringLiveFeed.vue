<template>
    <Card object-id="wdg_MonitoringLiveFeed">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <PanelHeader title="Live Operation Feed" />
            <div v-if="data && data.length > 0" class="w-full sm:w-64">
                <Input
                    id="txt_MonitoringLiveFeedSearch"
                    v-model="searchTerm"
                    label="Search live transactions"
                    label-class="sr-only"
                    type="text"
                    placeholder="Search operator, zone, event..."
                    object-id="txt_MonitoringLiveFeedSearch"
                >
                    <template #icon>
                        <Icon
                            :icon="Search"
                            :size="13"
                            class="text-text-muted"
                        />
                    </template>
                </Input>
            </div>
        </div>

        <div v-if="loading" class="space-y-2">
            <SkeletonBlock
                v-for="n in 6"
                :key="n"
                height="h-8"
            />
        </div>

        <StatusPanel
            v-else-if="!data || data.length === 0"
            title="No movement recorded"
            description="No movement recorded in the current window."
            :icon="Search"
            tone="neutral"
            class="border-0 bg-transparent py-6"
        />

        <StatusPanel
            v-else-if="filteredRows.length === 0"
            title="No matching operation rows"
            :description="`No operation rows match &quot;${searchTerm}&quot;.`"
            :icon="Search"
            tone="neutral"
            class="border-0 bg-transparent py-6"
        />

        <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr
                        class="text-left text-[10px] font-semibold uppercase text-text-muted"
                    >
                        <th class="pb-2 pr-3">Status</th>
                        <th class="pb-2 pr-3">Warehouse</th>
                        <th class="pb-2 pr-3">Zone</th>
                        <th class="pb-2 pr-3">Operator</th>
                        <th class="pb-2 pr-3">Event</th>
                        <th class="pb-2 pr-3">Timestamp</th>
                        <th class="pb-2 pr-3">Duration</th>
                        <th class="pb-2 pr-3">Priority</th>
                        <th class="pb-2">SLA</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, index) in filteredRows"
                        :key="index"
                        :class="rowClass(row)"
                    >
                        <td class="py-2 pr-3">
                            <Badge :tone="statusTone(row.status)">
                                {{
                                    row.status === "exception"
                                        ? "Exception"
                                        : "OK"
                                }}
                            </Badge>
                        </td>
                        <td class="py-2 pr-3">{{ row.warehouseName }}</td>
                        <td class="py-2 pr-3">{{ row.zoneLabel ?? "—" }}</td>
                        <td class="py-2 pr-3">{{ row.operatorName }}</td>
                        <td class="py-2 pr-3">{{ row.eventLabel }}</td>
                        <td class="py-2 pr-3 text-text-secondary">
                            {{ formatTimestamp(row.timestamp) }}
                        </td>
                        <td class="py-2 pr-3">{{ row.durationMinutes }} min</td>
                        <td class="py-2 pr-3">
                            <Badge :tone="priorityTone(row.priority)">
                                {{ row.priority }}
                            </Badge>
                        </td>
                        <td class="py-2">
                            <template v-if="row.slaPct !== null">
                                <ProgressBar
                                    :value="row.slaPct"
                                    :tone="slaTone(row.slaPct)"
                                />
                            </template>
                            <span v-else class="text-xs text-text-muted"
                                >—</span
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import ProgressBar from "@/components/molecules/ProgressBar.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import Input from "@/components/atoms/Input.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { Search } from "lucide-vue-next";
import type { LiveTransactionRow } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: LiveTransactionRow[] | null;
}>();

const searchTerm = ref("");

const filteredRows = computed(() => {
    const rows = props.data ?? [];
    const term = searchTerm.value.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
        [row.operatorName, row.zoneLabel, row.eventLabel, row.warehouseName]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(term)),
    );
});

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    });
};

type BadgeTone = "success" | "warning" | "error";

const priorityTone = (priority: LiveTransactionRow["priority"]): BadgeTone => {
    switch (priority) {
        case "high":
            return "error";
        case "med":
            return "warning";
        default:
            return "success";
    }
};

const rowClass = (row: LiveTransactionRow): string =>
    [
        "border-t border-border",
        row.status === "exception" ? "bg-danger-50/40" : "",
    ]
        .join(" ")
        .trim();

const statusTone = (status: LiveTransactionRow["status"]): BadgeTone =>
    status === "exception" ? "error" : "success";

const slaTone = (slaPct: number): BadgeTone => {
    if (slaPct >= 90) return "error";
    if (slaPct >= 75) return "warning";
    return "success";
};
</script>
