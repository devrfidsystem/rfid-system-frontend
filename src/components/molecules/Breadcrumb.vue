<template>
    <nav
        class="text-xs text-text-secondary overflow-x-auto hide-scrollbar whitespace-nowrap max-w-full"
        aria-label="breadcrumb"
    >
        <ul class="flex items-center gap-1.5 w-max">
            <li
                v-for="(item, index) in items"
                :key="item.label"
                class="flex items-center gap-1.5"
            >
                <span
                    :class="
                        item.active
                            ? 'text-gray-900 font-semibold'
                            : 'hover:text-gray-700 transition-colors'
                    "
                    >{{ item.label }}</span
                >
                <svg
                    v-if="index < items.length - 1"
                    class="h-3.5 w-3.5 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">
defineProps<{
    items: { label: string; active?: boolean }[];
}>();
</script>
