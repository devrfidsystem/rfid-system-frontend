<template>
    <div class="flex items-center gap-4">
        <svg
            :viewBox="`0 0 ${size} ${size}`"
            :width="size"
            :height="size"
            class="shrink-0"
            role="img"
            :aria-label="`Stage distribution: ${segments.map((s) => `${s.name} ${s.pct}%`).join(', ')}`"
        >
            <circle
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                class="stroke-gray-100"
                :stroke-width="strokeWidth"
            />
            <circle
                v-for="segment in segments"
                :key="segment.name"
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke="segment.color"
                :stroke-width="strokeWidth"
                stroke-linecap="round"
                :stroke-dasharray="`${segment.dash} ${circumference - segment.dash}`"
                :stroke-dashoffset="segment.offset"
                :transform="`rotate(-90 ${size / 2} ${size / 2})`"
            >
                <title>
                    {{ segment.name }}: {{ segment.count }} ({{ segment.pct }}%)
                </title>
            </circle>
            <text
                :x="size / 2"
                :y="size / 2 - 6"
                text-anchor="middle"
                class="fill-gray-900 text-[15px] font-bold"
            >
                {{ total }}
            </text>
            <text
                :x="size / 2"
                :y="size / 2 + 12"
                text-anchor="middle"
                class="fill-gray-500 text-[9px] font-semibold uppercase"
            >
                Open
            </text>
        </svg>

        <ul class="min-w-0 flex-1 space-y-1.5">
            <li
                v-for="segment in segments"
                :key="segment.name"
                class="flex items-center gap-2 text-xs"
            >
                <span
                    class="h-2 w-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: segment.color }"
                ></span>
                <span
                    class="min-w-0 flex-1 truncate font-medium text-gray-700"
                    >{{ segment.name }}</span
                >
                <span class="shrink-0 text-text-secondary"
                    >{{ segment.count }} · {{ segment.pct }}%</span
                >
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        stages: Array<{ name: string; count: number }>;
        size?: number;
    }>(),
    { size: 96 },
);

// Fixed categorical order, validated with scripts/validate_palette.js
// (dataviz skill): all 5 pairs pass CVD + normal-vision separation on the
// light surface. Never cycled — a 6th stage folds into "Other".
const PALETTE = ["#2563EB", "#0D9488", "#D97706", "#7C3AED", "#DC2626"];
const MAX_SEGMENTS = PALETTE.length;

const size = computed(() => props.size);
const strokeWidth = 12;
const radius = computed(() => size.value / 2 - strokeWidth / 2 - 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

const total = computed(() =>
    props.stages.reduce((sum, stage) => sum + stage.count, 0),
);

const groupedStages = computed(() => {
    const sorted = [...props.stages].sort((a, b) => b.count - a.count);
    if (sorted.length <= MAX_SEGMENTS) return sorted;
    const head = sorted.slice(0, MAX_SEGMENTS - 1);
    const restCount = sorted
        .slice(MAX_SEGMENTS - 1)
        .reduce((sum, stage) => sum + stage.count, 0);
    return [...head, { name: "Other", count: restCount }];
});

const segments = computed(() => {
    let offsetAccum = 0;
    return groupedStages.value.map((stage, index) => {
        const pct =
            total.value > 0 ? Math.round((stage.count / total.value) * 100) : 0;
        const dash =
            total.value > 0
                ? (stage.count / total.value) * circumference.value
                : 0;
        const segment = {
            name: stage.name,
            count: stage.count,
            pct,
            color: PALETTE[index % PALETTE.length],
            dash,
            offset: -offsetAccum,
        };
        offsetAccum += dash;
        return segment;
    });
});
</script>
