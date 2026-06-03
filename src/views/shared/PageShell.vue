<template>
    <section class="space-y-6">
        <PageHeader :title="title" :description="description" tagline="RFID" />
        <Card>
            <EmptyState
                title="Halaman belum tersedia"
                :description="`${title} belum memiliki implementasi operasional. Hubungkan route ini ke halaman fitur sebelum dirilis ke user.`"
                variant="default"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";

const props = defineProps<{
    title: string;
    description: string;
}>();

const { title, description } = toRefs(props);
</script>
