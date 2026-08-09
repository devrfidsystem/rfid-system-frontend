<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="selectedWarehouseId"
            :warehouse-options="warehouseOptions"
            :loading="loading"
            @update:warehouse-id="setSelectedWarehouse"
            @refresh="refresh"
        />

        <PageHeader
            title="Executive KPI"
            description="Explaining why operations improved or declined compared with the previous period"
            tagline="Dashboard"
        >
            <template #actions>
                <RouterLink
                    to="/dashboard/process"
                    class="shrink-0 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                    View Process Performance →
                </RouterLink>
            </template>
        </PageHeader>

        <InlineAlert
            v-if="errorMessage"
            variant="error"
            title="Executive KPI unavailable"
            :description="errorMessage"
        />

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
import { computed, onMounted, unref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHeader from "@/components/molecules/PageHeader.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import DashboardToolbar from "./components/DashboardToolbar.vue";
import KpiDomainTabs from "./components/KpiDomainTabs.vue";
import KpiDomainHero from "./components/KpiDomainHero.vue";
import KpiWarehouseComparison from "./components/KpiWarehouseComparison.vue";
import KpiContributors from "./components/KpiContributors.vue";
import KpiSupportingMetrics from "./components/KpiSupportingMetrics.vue";
import { useExecutiveKpi } from "./composables/useExecutiveKpi";
import type { DashboardKpiDomain } from "@/model/dashboard";

const VALID_DOMAINS = new Set<DashboardKpiDomain>([
    "stockIn",
    "inventory",
    "stockOut",
]);

const route = useRoute();
const {
    domain,
    setDomain,
    data,
    loading,
    error,
    refresh,
    warehouseOptions,
    selectedWarehouseId,
    setSelectedWarehouse,
} = useExecutiveKpi();

const errorMessage = computed(() => {
    const value = unref(error);
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "value" in value) {
        const nestedValue = (value as { value?: unknown }).value;
        return typeof nestedValue === "string" ? nestedValue : "";
    }
    return "";
});

onMounted(() => {
    const requestedDomain = route.query.domain;
    if (
        typeof requestedDomain === "string" &&
        VALID_DOMAINS.has(requestedDomain as DashboardKpiDomain)
    ) {
        void setDomain(requestedDomain as DashboardKpiDomain);
        return;
    }
    void refresh();
});
</script>
