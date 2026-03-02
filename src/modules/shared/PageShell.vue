<template>
  <section class="space-y-6">
    <PageHeader :title="title" :description="description" tagline="RFID" />
    <Card>
      <div class="space-y-4 text-sm text-gray-600">
        <p>This section is reserved for the {{ title }} experience.</p>
        <ul class="space-y-2 text-xs text-gray-500">
          <li>• Layout ready for enterprise workflows</li>
          <li>• Integrate components per design system</li>
          <li>• Placeholder until module requirements arrive</li>
        </ul>
      </div>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import PageHeader from '@/app/ui/PageHeader.vue';
import Card from '@/app/ui/Card.vue';

const props = defineProps<{
  title: string;
  description: string;
}>();

const { title, description } = toRefs(props);
</script>
