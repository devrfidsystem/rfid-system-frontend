<template>
    <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
            <div>
                <span class="text-xs font-medium text-text-secondary">{{
                    label
                }}</span>
                <div class="mt-0.5 flex items-baseline gap-1.5">
                    <span
                        class="text-2xl font-semibold text-text tabular-nums"
                        >{{ lastValue }}</span
                    >
                    <span class="text-xs font-normal text-text-muted">{{
                        unit
                    }}</span>
                </div>
            </div>

            <span
                v-if="delta !== null"
                class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="
                    deltaIsGood
                        ? 'bg-success-50 text-success-600'
                        : 'bg-danger-50 text-danger-600'
                "
            >
                <Icon :icon="delta >= 0 ? ArrowUp : ArrowDown" :size="12" />
                {{ Math.abs(delta).toFixed(1) }}%
            </span>
        </div>

        <div class="relative">
            <svg
                ref="svgRef"
                class="h-28 w-full"
                :viewBox="`0 0 ${width} ${height}`"
                preserveAspectRatio="none"
                @pointermove="handlePointerMove"
                @pointerleave="hoverIndex = null"
            >
                <defs>
                    <linearGradient
                        :id="gradientId"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <!-- stop-color isn't a Tailwind utility (fill/stroke
                        classes don't apply to <stop>), so it's set inline. -->
                        <stop
                            offset="0%"
                            :style="{ stopColor: color, stopOpacity: 0.28 }"
                        />
                        <stop
                            offset="100%"
                            :style="{ stopColor: color, stopOpacity: 0 }"
                        />
                    </linearGradient>
                </defs>

                <!-- Recessive reference gridlines -->
                <line
                    v-for="gridY in gridLines"
                    :key="gridY"
                    :x1="padding"
                    :x2="width - padding"
                    :y1="gridY"
                    :y2="gridY"
                    class="stroke-border"
                    stroke-width="1"
                />

                <!-- Gradient area wash under the smoothed line -->
                <path :d="areaPath" :fill="`url(#${gradientId})`" />

                <!-- The smoothed line itself -->
                <path
                    :d="linePath"
                    fill="none"
                    :class="strokeClass"
                    stroke-width="2"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                />

                <!-- End-point marker with a surface ring -->
                <circle
                    v-if="lastPoint"
                    :cx="lastPoint.x"
                    :cy="lastPoint.y"
                    r="4"
                    class="fill-surface"
                />
                <circle
                    v-if="lastPoint"
                    :cx="lastPoint.x"
                    :cy="lastPoint.y"
                    r="3"
                    :class="dotClass"
                />

                <!-- Hover crosshair -->
                <line
                    v-if="hoverPoint"
                    :x1="hoverPoint.x"
                    :x2="hoverPoint.x"
                    :y1="padding"
                    :y2="height - padding"
                    class="stroke-border"
                    stroke-width="1"
                />
                <circle
                    v-if="hoverPoint"
                    :cx="hoverPoint.x"
                    :cy="hoverPoint.y"
                    r="3"
                    class="fill-surface"
                />
                <circle
                    v-if="hoverPoint"
                    :cx="hoverPoint.x"
                    :cy="hoverPoint.y"
                    r="2"
                    :class="dotClass"
                />
            </svg>

            <div
                v-if="hoverIndex !== null && points[hoverIndex]"
                class="pointer-events-none absolute top-0 -translate-y-full rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-sm"
                :style="{ left: `${hoverPercent}%` }"
            >
                <div class="font-medium text-text tabular-nums">
                    {{ points[hoverIndex].value }} {{ unit }}
                </div>
                <div class="text-text-muted">
                    {{ points[hoverIndex].period }}
                </div>
            </div>
        </div>

        <div class="flex justify-between text-[10px] text-text-muted">
            <span>{{ points[0]?.period }}</span>
            <span>{{ points[points.length - 1]?.period }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import { ArrowUp, ArrowDown } from "lucide-vue-next";

const props = defineProps<{
    label: string;
    unit: string;
    points: Array<{ period: string; value: number }>;
    strokeClass: string;
    dotClass: string;
    /** CSS color used for the gradient fill (stop-color isn't a Tailwind utility). */
    color: string;
    /** Whether an increasing value is the desirable direction (controls delta badge color). */
    higherIsBetter: boolean;
}>();

const width = 100;
const height = 40;
const padding = 3;

const svgRef = ref<SVGSVGElement | null>(null);
const hoverIndex = ref<number | null>(null);
// Deterministic (not random/useId) so it's stable across SSR and re-renders —
// unique per instance as long as sibling charts have distinct labels.
const gradientId = computed(
    () => `trend-gradient-${props.label.replace(/\s+/g, "-").toLowerCase()}`,
);

const scaled = computed(() => {
    const values = props.points.map((point) => point.value);
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

    return props.points.map((point, index) => ({
        ...point,
        x: padding + index * step,
        y: padding + innerHeight - ((point.value - min) / range) * innerHeight,
    }));
});

const gridLines = computed(() => {
    const innerHeight = height - padding * 2;
    return [0.25, 0.5, 0.75].map((ratio) => padding + innerHeight * ratio);
});

/** Smooths a point sequence into a quadratic-bezier path through midpoints. */
const toSmoothPath = (pts: Array<{ x: number; y: number }>): string => {
    if (!pts.length) return "";
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;

    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        d += ` Q ${prev.x},${prev.y} ${midX},${midY}`;
    }
    const last = pts[pts.length - 1];
    d += ` T ${last.x},${last.y}`;
    return d;
};

const linePath = computed(() => toSmoothPath(scaled.value));

const areaPath = computed(() => {
    if (!scaled.value.length) return "";
    const baseline = height - padding;
    const first = scaled.value[0];
    const last = scaled.value[scaled.value.length - 1];
    return `${toSmoothPath(scaled.value)} L ${last.x},${baseline} L ${first.x},${baseline} Z`;
});

const lastPoint = computed(() => scaled.value[scaled.value.length - 1]);
const lastValue = computed(
    () => props.points[props.points.length - 1]?.value ?? "-",
);

const delta = computed(() => {
    const first = props.points[0]?.value;
    const last = props.points[props.points.length - 1]?.value;
    if (first === undefined || last === undefined || first === 0) return null;
    return ((last - first) / Math.abs(first)) * 100;
});

const deltaIsGood = computed(() => {
    if (delta.value === null) return true;
    const increased = delta.value >= 0;
    return props.higherIsBetter ? increased : !increased;
});

const hoverPoint = computed(() =>
    hoverIndex.value !== null ? (scaled.value[hoverIndex.value] ?? null) : null,
);

const hoverPercent = computed(() => {
    if (!hoverPoint.value) return 0;
    return (hoverPoint.value.x / width) * 100;
});

const handlePointerMove = (event: PointerEvent) => {
    if (!svgRef.value || !scaled.value.length) return;
    const rect = svgRef.value.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const targetX = ratio * width;

    let nearestIndex = 0;
    let nearestDistance = Infinity;
    scaled.value.forEach((point, index) => {
        const distance = Math.abs(point.x - targetX);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });
    hoverIndex.value = nearestIndex;
};
</script>
