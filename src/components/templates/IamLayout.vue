<template>
    <section class="space-y-6">
        <PageHeader
            title="Identity and Access"
            description="Manage roles and user permissions."
        />

        <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <router-link
                    v-for="tab in tabs"
                    :key="tab.name"
                    :to="tab.href"
                    :class="[
                        $route.path.startsWith(tab.href)
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
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
    { name: "Roles", href: "/iam/roles" },
    { name: "User Access", href: "/iam/users" },
];
</script>
