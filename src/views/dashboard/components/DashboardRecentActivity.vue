<template>
    <Card
        object-id="wdg_DashboardRecentActivity"
        class="bg-transparent border-0 shadow-none p-0"
    >
        <div class="mb-4">
            <h2
                class="text-lg font-semibold text-gray-900 flex justify-between items-center"
            >
                <span>Recent Activity</span>
                <span
                    class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"
                >
                    <span
                        class="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    ></span>
                    LIVE
                </span>
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">
                Live warehouse operations
            </p>
        </div>

        <div>
            <div v-if="loading" class="space-y-4">
                <div
                    v-for="n in 4"
                    :key="`act-skel-${n}`"
                    class="flex gap-4 animate-pulse bg-white p-4 rounded-xl"
                >
                    <div
                        class="h-12 w-12 bg-workspace-bg rounded-xl shrink-0"
                    ></div>
                    <div class="space-y-2 flex-1 pt-2">
                        <div class="h-4 bg-workspace-bg rounded w-1/4"></div>
                        <div class="h-3 bg-workspace-bg rounded w-3/4"></div>
                    </div>
                </div>
            </div>
            <div
                v-else-if="!recentActivity.length"
                class="rounded-xl border border-gray-100 bg-white p-8 flex flex-col items-center text-center shadow-sm"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 mb-3 text-gray-400"
                >
                    <Icon :icon="LayoutDashboard" :size="24" />
                </div>
                <p class="text-sm font-medium text-gray-900">
                    No operational activity
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    No operations have been recorded yet.
                </p>
            </div>
            <div v-else class="space-y-3">
                <div
                    v-for="activity in recentActivity"
                    :key="activity.id"
                    class="flex space-x-4 p-4 rounded-2xl"
                    :class="getCardBgColor(activity.type)"
                >
                    <div class="shrink-0">
                        <span
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1"
                            :class="getIconColorClass(activity.type)"
                        >
                            <Icon
                                :icon="getIconForType(activity.type)"
                                :size="22"
                            />
                        </span>
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <div class="flex items-center justify-between">
                            <p
                                class="text-sm font-bold"
                                :class="getTitleColorClass(activity.type)"
                            >
                                {{ activity.title }}
                            </p>
                            <div
                                class="flex items-center text-xs text-gray-500"
                            >
                                <Icon
                                    :icon="Clock"
                                    :size="12"
                                    class="mr-1 opacity-70"
                                />
                                {{ formatActivityTime(activity.createdAt) }}
                            </div>
                        </div>
                        <p class="text-sm text-gray-700 mt-0.5 truncate">
                            {{ activity.summary }}
                        </p>
                        <div
                            class="flex items-center text-xs text-gray-500 mt-1.5 font-medium"
                        >
                            <Icon
                                :icon="User"
                                :size="12"
                                class="mr-1.5 opacity-70"
                            />
                            {{ activity.userName }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import {
    LayoutDashboard,
    Tag,
    ArrowLeftRight,
    LogOut,
    LogIn,
    Clock,
    User,
} from "lucide-vue-next";
import { formatDistanceToNow } from "@/utils/date";

type ActivityType =
    | "tag_registration"
    | "item_movement"
    | "outbound"
    | "inbound";

defineProps<{
    loading: boolean;
    recentActivity: Array<{
        id: string;
        type: ActivityType;
        title: string;
        summary: string;
        userName: string;
        createdAt: string;
    }>;
}>();

const formatActivityTime = (timestamp?: string) => {
    if (!timestamp) return "";
    return formatDistanceToNow(new Date(timestamp));
};

const getIconForType = (type: ActivityType) => {
    switch (type) {
        case "tag_registration":
            return Tag;
        case "item_movement":
            return ArrowLeftRight;
        case "outbound":
            return LogOut;
        case "inbound":
            return LogIn; // Using LogIn or Truck
        default:
            return LayoutDashboard;
    }
};

const getCardBgColor = (type: ActivityType) => {
    switch (type) {
        case "tag_registration":
            return "bg-purple-50/50 border border-purple-100/50";
        case "item_movement":
            return "bg-cyan-50/50 border border-cyan-100/50";
        case "outbound":
            return "bg-red-50/50 border border-red-100/50";
        case "inbound":
            return "bg-emerald-50/50 border border-emerald-100/50";
        default:
            return "bg-gray-50/50 border border-gray-100/50";
    }
};

const getIconColorClass = (type: ActivityType) => {
    switch (type) {
        case "tag_registration":
            return "text-purple-600 ring-purple-100";
        case "item_movement":
            return "text-cyan-600 ring-cyan-100";
        case "outbound":
            return "text-red-600 ring-red-100";
        case "inbound":
            return "text-emerald-600 ring-emerald-100";
        default:
            return "text-gray-600 ring-gray-100";
    }
};

const getTitleColorClass = (type: ActivityType) => {
    switch (type) {
        case "tag_registration":
            return "text-purple-600";
        case "item_movement":
            return "text-cyan-600";
        case "outbound":
            return "text-red-600";
        case "inbound":
            return "text-emerald-600";
        default:
            return "text-gray-900";
    }
};
</script>
