<template>
    <section class="space-y-6">
        <PageHeader
            title="Settings"
            description="Maintain company, app, and menu configuration for warehouse operations."
        />

        <div class="border-b border-border">
            <nav
                class="-mb-px flex space-x-8 px-6 overflow-x-auto hide-scrollbar"
                aria-label="Tabs"
            >
                <router-link
                    v-for="tab in tabs"
                    :key="tab.name"
                    :to="tab.href"
                    :class="[
                        $route.path.startsWith(tab.href)
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-text-secondary hover:border-border hover:text-text',
                        'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                    ]"
                >
                    {{ tab.name }}
                </router-link>
            </nav>
        </div>

        <div class="pt-4">
            <router-view v-slot="{ Component, route }">
                <transition name="fade" mode="out-in">
                    <component :is="Component" :key="route.fullPath" />
                </transition>
            </router-view>
        </div>
    </section>
</template>

<script setup lang="ts">
import PageHeader from "@/components/molecules/PageHeader.vue";

const tabs = [
    { name: "Companies", href: "/settings/companies" },
    { name: "Applications", href: "/settings/apps" },
    { name: "Menus", href: "/settings/menus" },
];
</script>
