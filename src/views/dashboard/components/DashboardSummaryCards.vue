<template>
    <div>
        <!-- Summary Cards Skeleton -->
        <div
            v-if="loading"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
            <Card
                v-for="n in 5"
                :key="`skeleton-${n}`"
                class="border-border-default ring-0"
            >
                <div
                    class="flex h-24 animate-pulse flex-col justify-between rounded-md bg-workspace-bg p-4"
                ></div>
            </Card>
        </div>

        <!-- Summary Cards Content -->
        <div
            v-else
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
            <Card
                v-for="card in cards"
                :key="card.label"
                :class="`transition-shadow hover:shadow-md ${card.cardClass}`"
            >
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-sm font-medium text-gray-500">
                            {{ card.label }}
                        </p>
                        <p class="text-3xl font-bold text-gray-900 mt-2">
                            {{ card.value }}
                        </p>
                        <p
                            class="text-xs text-gray-500 mt-1 truncate max-w-[150px]"
                            :title="card.caption"
                        >
                            {{ card.caption }}
                        </p>
                    </div>
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 ring-1 ring-gray-200"
                        :class="card.iconColorClass"
                    >
                        <Icon :icon="card.icon" :size="18" />
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";

defineProps<{
    loading: boolean;
    cards: Array<{
        label: string;
        value: string | number;
        caption: string;
        icon: import("vue").Component;
        iconColorClass: string;
        cardClass: string;
    }>;
}>();
</script>
