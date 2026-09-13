<template>
    <Drawer
        :model-value="isOpen"
        title="Notifications & Activity"
        side="right"
        width="xs"
        @update:model-value="emit('update:isOpen', $event)"
        @close="emit('close')"
    >
        <div class="space-y-6">
            <section>
                <div class="mb-4 flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-text">
                        Recent Notifications
                    </h4>
                    <button
                        class="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
                    >
                        Mark all as read
                    </button>
                </div>
                <div class="space-y-3">
                    <div
                        v-for="notification in notifications"
                        :key="notification.id"
                        class="flex gap-3 rounded-md border p-3 transition-colors"
                        :class="
                            notification.unread
                                ? 'border-primary-100 bg-primary-50/60'
                                : 'border-border bg-surface hover:bg-surface-secondary'
                        "
                    >
                        <div class="mt-0.5">
                            <div
                                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600"
                            >
                                <Icon :icon="notification.icon" :size="16" />
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="truncate text-sm font-medium text-text">
                                {{ notification.title }}
                            </p>
                            <p
                                class="mt-0.5 line-clamp-2 text-xs text-text-secondary"
                            >
                                {{ notification.message }}
                            </p>
                            <p class="mt-1.5 text-xs text-text-muted">
                                {{ notification.time }}
                            </p>
                        </div>
                        <div
                            v-if="notification.unread"
                            class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600"
                        ></div>
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
</script>
