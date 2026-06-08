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
                class="flex flex-col justify-between"
                object-id="wdg_DashboardSummaryItems"
            >
                <div
                    class="flex h-24 animate-pulse flex-col justify-between rounded-md bg-workspace-bg p-4"
                ></div>
            </Card>
        </div>

        <div
            v-else
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
            <Card
                v-for="card in cards"
                :key="card.label"
                :class="`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ring-1 ring-white/50 ${getThemeClasses(card.theme).card}`"
                data-testid="card-2"
            >
                <!-- Decorative Blur Blob -->
                <div
                    class="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150"
                    :class="getThemeClasses(card.theme).blob"
                ></div>

                <div
                    class="relative z-10 flex items-start justify-between gap-3"
                >
                    <div>
                        <p
                            class="text-sm font-semibold tracking-wide"
                            :class="getThemeClasses(card.theme).label"
                        >
                            {{ card.label }}
                        </p>
                        <p
                            class="text-3xl font-extrabold mt-1.5 tracking-tight"
                            :class="getThemeClasses(card.theme).value"
                        >
                            {{ card.value }}
                        </p>
                        <p
                            class="text-xs mt-1 truncate max-w-[150px] font-medium"
                            :class="getThemeClasses(card.theme).caption"
                            :title="card.caption"
                        >
                            {{ card.caption }}
                        </p>
                    </div>
                    <div
                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1"
                        :class="getThemeClasses(card.theme).icon"
                    >
                        <Icon :icon="card.icon" :size="20" stroke-width="2.5" />
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";

defineProps<{
    loading: boolean;
    cards: Array<{
        label: string;
        value: string | number;
        caption: string;
        icon: import("vue").Component;
        theme: string;
    }>;
}>();

const getThemeClasses = (theme: string) => {
    const themes: Record<string, any> = {
        blue: {
            card: "bg-blue-50 border-blue-100 shadow-blue-100/50",
            blob: "bg-blue-400",
            label: "text-blue-600/90",
            value: "text-blue-950",
            caption: "text-blue-500",
            icon: "text-blue-600 ring-blue-100",
        },
        teal: {
            card: "bg-teal-50 border-teal-100 shadow-teal-100/50",
            blob: "bg-teal-400",
            label: "text-teal-700/90",
            value: "text-teal-950",
            caption: "text-teal-600",
            icon: "text-teal-600 ring-teal-100",
        },
        purple: {
            card: "bg-indigo-50 border-indigo-100 shadow-indigo-100/50",
            blob: "bg-indigo-400",
            label: "text-indigo-600/90",
            value: "text-indigo-950",
            caption: "text-indigo-500",
            icon: "text-indigo-600 ring-indigo-100",
        },
        amber: {
            card: "bg-amber-50 border-amber-100 shadow-amber-100/50",
            blob: "bg-amber-400",
            label: "text-amber-700/90",
            value: "text-amber-950",
            caption: "text-amber-600",
            icon: "text-amber-600 ring-amber-100",
        },
        red: {
            card: "bg-rose-50 border-rose-100 shadow-rose-100/50",
            blob: "bg-rose-400",
            label: "text-rose-600/90",
            value: "text-rose-950",
            caption: "text-rose-500",
            icon: "text-rose-600 ring-rose-100",
        },
    };
    return themes[theme] || themes.blue;
};
</script>
