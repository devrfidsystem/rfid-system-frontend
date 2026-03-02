<template>
  <div class="table-panel shadow-sm">
    <div class="max-h-[550px] overflow-auto">
      <table class="min-w-full">
        <thead class="bg-gray-100 text-left text-xs uppercase tracking-[0.3em] text-gray-500">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-left font-semibold"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="row.id ?? index"
            :class="['border-t border-gray-100 transition duration-150', (index + 1) % 2 === 0 ? 'bg-gray-50/60' : '', 'hover:bg-gray-50']"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 align-top text-sm text-gray-700"
            >
              <slot :name="column.key" :row="row">{{ row[column.key] }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}>();
</script>
