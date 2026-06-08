<template>
    <Card object-id="wdg_DashboardRecentActivity">
        <div>
            <h2 class="text-lg font-semibold text-gray-900">
                Operational Activity
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">
                Real-time tracking of physical movements and documents.
            </p>
        </div>

        <div class="mt-8">
            <div v-if="loading" class="space-y-6">
                <div
                    v-for="n in 5"
                    :key="`act-skel-${n}`"
                    class="flex gap-4 animate-pulse"
                >
                    <div
                        class="h-10 w-10 bg-workspace-bg rounded-full shrink-0"
                    ></div>
                    <div class="space-y-2 flex-1 pt-2">
                        <div class="h-3.5 bg-workspace-bg rounded w-3/4"></div>
                        <div class="h-3 bg-workspace-bg rounded w-1/4"></div>
                    </div>
                </div>
            </div>
            <div
                v-else-if="!recentActivity.length"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 flex flex-col items-center text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-3 text-gray-400"
                >
                    <Icon :icon="LayoutDashboard" :size="20" />
                </div>
                <p class="text-sm font-medium text-gray-900">
                    No operational activity
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    No operations have been recorded yet.
                </p>
            </div>
            <div v-else class="flow-root pl-4">
                <ul role="list" class="-mb-8">
                    <li
                        v-for="(activity, actIdx) in recentActivity"
                        :key="activity.id"
                    >
                        <div class="relative pb-8">
                            <span
                                v-if="actIdx !== recentActivity.length - 1"
                                class="absolute left-6 top-6 -ml-px h-full w-0.5 bg-gray-100"
                                aria-hidden="true"
                            ></span>
                            <div class="relative flex space-x-4">
                                <div>
                                    <span
                                        class="flex h-12 w-12 items-center justify-center rounded-full ring-8 ring-white shrink-0 animate-fade-in"
                                        :class="
                                            activity.qty >= 0
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-50/50'
                                                : 'bg-orange-50 text-orange-700 ring-orange-50/50'
                                        "
                                    >
                                        <Icon
                                            :icon="
                                                activity.qty >= 0
                                                    ? ArrowDownRight
                                                    : ArrowUpRight
                                            "
                                            :size="18"
                                        />
                                    </span>
                                </div>
                                <div
                                    class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5"
                                >
                                    <div>
                                        <p class="text-sm text-gray-800">
                                            <span
                                                class="font-bold text-gray-900"
                                                >{{
                                                    activity.qty >= 0
                                                        ? "Inbound"
                                                        : "Outbound"
                                                }}</span
                                            >
                                            dari
                                            <span
                                                class="font-bold text-gray-900"
                                                >{{
                                                    activity.productName
                                                }}</span
                                            >
                                            (<span
                                                class="font-semibold text-primary-600"
                                                >{{
                                                    activity.productCode
                                                }}</span
                                            >) di lokasi
                                            <span
                                                class="font-semibold text-text-secondary"
                                                >{{ activity.warehouseCode }}
                                                ·
                                                {{
                                                    activity.locationCode
                                                }}</span
                                            >
                                        </p>
                                        <div
                                            class="mt-1.5 flex items-center gap-2"
                                        >
                                            <span
                                                class="inline-flex items-center rounded bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/10"
                                            >
                                                {{ activity.docReference }}
                                            </span>
                                            <span
                                                class="text-xs text-text-secondary"
                                                >{{
                                                    formatActivityTime(
                                                        activity.createdAt,
                                                    )
                                                }}</span
                                            >
                                        </div>
                                    </div>
                                    <div
                                        class="whitespace-nowrap text-right text-sm"
                                    >
                                        <span
                                            class="font-extrabold"
                                            :class="
                                                activity.qty >= 0
                                                    ? 'text-emerald-600'
                                                    : 'text-orange-600'
                                            "
                                        >
                                            {{
                                                activity.qty >= 0
                                                    ? `+${activity.qty}`
                                                    : activity.qty
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { LayoutDashboard, ArrowDownRight, ArrowUpRight } from "lucide-vue-next";

defineProps<{
    loading: boolean;
    recentActivity: Array<{
        id: string;
        qty: number;
        productName: string;
        productCode: string;
        warehouseCode: string;
        locationCode: string;
        docReference: string;
        createdAt: string;
    }>;
}>();

const formatActivityTime = (timestamp?: string) => {
    if (!timestamp) return "";
    try {
        const date = new Date(timestamp);
        return date.toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return timestamp;
    }
};
</script>
