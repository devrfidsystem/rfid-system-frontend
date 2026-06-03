<template>
    <div class="table-panel shadow-sm">
        <div class="max-h-[550px] overflow-auto">
            <table class="min-w-full">
                <thead
                    class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200"
                >
                    <tr>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            class="px-6 py-3 text-left"
                        >
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr
                        v-for="(row, index) in rows"
                        :key="row.id ?? index"
                        class="transition-colors duration-150 hover:bg-gray-50"
                    >
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            class="px-6 py-3 align-top text-sm text-gray-700"
                        >
                            <slot :name="column.key" :row="row">{{
                                row[column.key]
                            }}</slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div
            v-if="$slots.footer"
            class="border-t border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-500"
        >
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    columns: { key: string; label: string }[];
    rows: Record<string, string | number>[];
}>();
</script>
