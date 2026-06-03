<template>
    <Drawer
        :model-value="isOpen"
        title="Notifications & Activity"
        side="right"
        width="sm"
        @update:model-value="emit('update:isOpen', $event)"
        @close="emit('close')"
    >
        <div class="space-y-8">
            <!-- Notifications Section -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-semibold text-gray-900">
                        Recent Notifications
                    </h4>
                    <button
                        class="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                        Mark all as read
                    </button>
                </div>
                <div class="space-y-3">
                    <div
                        v-for="notification in notifications"
                        :key="notification.id"
                        class="flex gap-3 p-3 rounded-lg border transition-colors"
                        :class="
                            notification.unread
                                ? 'bg-primary-50/50 border-primary-100'
                                : 'bg-white border-gray-100 hover:bg-gray-50'
                        "
                    >
                        <div class="mt-0.5">
                            <div
                                class="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center"
                            >
                                <Icon :icon="notification.icon" :size="16" />
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p
                                class="text-sm font-medium text-gray-900 truncate"
                            >
                                {{ notification.title }}
                            </p>
                            <p
                                class="text-xs text-gray-500 mt-0.5 line-clamp-2"
                            >
                                {{ notification.message }}
                            </p>
                            <p class="text-xs text-gray-400 mt-1.5">
                                {{ notification.time }}
                            </p>
                        </div>
                        <div
                            v-if="notification.unread"
                            class="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0"
                        ></div>
                    </div>
                </div>
            </section>

            <!-- Activity Section -->
            <section>
                <h4 class="text-sm font-semibold text-gray-900 mb-4">
                    Recent Activity
                </h4>
                <div class="relative border-l border-gray-200 ml-3 space-y-6">
                    <div
                        v-for="activity in activities"
                        :key="activity.id"
                        class="relative pl-6"
                    >
                        <div
                            class="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border-2 border-white"
                            :class="activity.colorClass"
                        ></div>
                        <div>
                            <p class="text-sm text-gray-800">
                                <span class="font-medium text-gray-900">{{
                                    activity.user
                                }}</span>
                                {{ activity.action }}
                                <span class="font-medium text-gray-900">{{
                                    activity.target
                                }}</span>
                            </p>
                            <p class="text-xs text-gray-500 mt-1">
                                {{ activity.time }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import Drawer from "@/components/organisms/Drawer.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertCircle, ArrowDownToLine, CheckCircle2 } from "lucide-vue-next";

defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: "update:isOpen", value: boolean): void;
    (e: "close"): void;
}>();

// Dummy Data
const notifications = [
    {
        id: 1,
        title: "Low Stock Alert",
        message:
            "Item 'Basic Cotton T-Shirt' has fallen below minimum stock level.",
        time: "10 mins ago",
        icon: AlertCircle,
        unread: true,
    },
    {
        id: 2,
        title: "Inbound Completed",
        message: "Inbound shipment INB-20260601 has been fully received.",
        time: "1 hour ago",
        icon: ArrowDownToLine,
        unread: true,
    },
    {
        id: 3,
        title: "Opname Scheduled",
        message: "A new stock opname cycle has been scheduled for tomorrow.",
        time: "5 hours ago",
        icon: CheckCircle2,
        unread: false,
    },
];

const activities = [
    {
        id: 1,
        user: "Aditya Aria",
        action: "created a new outbound order",
        target: "OUT-20260602",
        time: "Just now",
        colorClass: "bg-blue-500",
    },
    {
        id: 2,
        user: "System",
        action: "registered new RFID tag",
        target: "EPC-1093847192",
        time: "25 mins ago",
        colorClass: "bg-teal-500",
    },
    {
        id: 3,
        user: "Aditya Aria",
        action: "updated master product",
        target: 'Laptop Pro 15"',
        time: "2 hours ago",
        colorClass: "bg-amber-500",
    },
    {
        id: 4,
        user: "Warehouse Staff",
        action: "completed cycle count for zone",
        target: "Aisle A",
        time: "Yesterday",
        colorClass: "bg-gray-400",
    },
];
</script>
