<template>
    <section class="space-y-6">
        <PageHeader
            title="Identity and Access"
            description="Manage roles and user permissions."
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
                        tab.href === activeTabHref
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
import { computed } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "@/components/molecules/PageHeader.vue";

const tabs = [
    { name: "Roles", href: "/iam/roles" },
    { name: "User Access", href: "/iam/users" },
    { name: "Role Menus", href: "/iam/roles/menus" },
];

const route = useRoute();

// Pick the longest matching href, not "any" prefix match — otherwise
// "/iam/roles/menus" would match both the "Roles" and "Role Menus" tabs
// as prefixes and highlight two tabs at once.
const activeTabHref = computed(() => {
    const matches = tabs
        .filter((tab) => route.path.startsWith(tab.href))
        .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href;
});
</script>
