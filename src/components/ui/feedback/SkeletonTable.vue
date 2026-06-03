<template>
    <div class="w-full space-y-3">
        <div
            class="grid gap-3 text-xs uppercase tracking-wider text-gray-400"
            :style="{ gridTemplateColumns: columnsTemplate }"
        >
            <SkeletonBlock
                v-for="col in cols"
                :key="`header-${col}`"
                :height="'1rem'"
                :width="'100%'"
            />
        </div>
        <div
            v-for="row in rows"
            :key="`row-${row}`"
            class="grid gap-3"
            :style="{ gridTemplateColumns: columnsTemplate }"
        >
            <SkeletonBlock
                v-for="col in cols"
                :key="`cell-${row}-${col}`"
                :height="'1.25rem'"
                :width="'100%'"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SkeletonBlock from "./SkeletonBlock.vue";

const props = defineProps<{
    rows?: number;
    cols?: number;
}>();

const rows = computed(() => props.rows ?? 6);
const cols = computed(() => props.cols ?? 5);
const columnsTemplate = computed(() => `repeat(${cols.value}, minmax(0, 1fr))`);
</script>
