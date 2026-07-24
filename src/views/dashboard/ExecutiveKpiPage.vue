<template>
    <section class="space-y-6">
        <div>
            <h1 class="text-xl font-bold text-gray-900">Executive KPI</h1>
            <p class="text-sm text-text-secondary mt-0.5">
                Explaining why operations improved or declined compared with the
                previous period
            </p>
        </div>

        <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ error }}
        </p>

        <KpiDomainTabs :model-value="domain" @update:model-value="setDomain" />
        <KpiDomainHero :loading="loading" :data="data" />
        <div class="grid gap-6 lg:grid-cols-2">
            <KpiWarehouseComparison
                :loading="loading"
                :data="data?.warehouseComparison ?? null"
            />
            <KpiContributors
                :loading="loading"
                :data="data?.contributors ?? null"
            />
        </div>
        <KpiSupportingMetrics
            :loading="loading"
            :data="data?.supportingMetrics ?? null"
        />
    </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import KpiDomainTabs from "./components/KpiDomainTabs.vue";
import KpiDomainHero from "./components/KpiDomainHero.vue";
import KpiWarehouseComparison from "./components/KpiWarehouseComparison.vue";
import KpiContributors from "./components/KpiContributors.vue";
import KpiSupportingMetrics from "./components/KpiSupportingMetrics.vue";
import { useExecutiveKpi } from "./composables/useExecutiveKpi";

const { domain, setDomain, data, loading, error, refresh } = useExecutiveKpi();

onMounted(() => {
    void refresh();
});
</script>
