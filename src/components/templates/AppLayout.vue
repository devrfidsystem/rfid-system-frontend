<template>
    <div class="min-h-screen bg-workspace-bg text-gray-900">
        <div
            class="grid grid-cols-1 gap-0"
            :class="['grid grid-cols-1 gap-0', columnsClass]"
        >
            <Sidebar class="hidden lg:block" />
            <div class="min-w-0 flex flex-col bg-workspace-bg h-screen">
                <Topbar @toggle-sidebar="ui.toggleSidebar" />
                <div
                    id="page-toolbar-slot"
                    class="empty:hidden bg-white border-b border-gray-200 z-20 shrink-0"
                ></div>
                <main class="flex-1 overflow-auto px-4 py-5 lg:px-8 lg:py-6">
                    <div class="mx-auto w-full max-w-[1400px] space-y-6">
                        <router-view v-slot="{ Component, route: viewRoute }">
                            <component
                                :is="Component"
                                :key="viewRoute.fullPath"
                            />
                        </router-view>
                    </div>
                </main>
            </div>
        </div>
        <transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
        >
            <div v-if="ui.sidebarOpen" class="fixed inset-0 z-40 lg:hidden">
                <div
                    class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                    @click="ui.closeSidebar"
                ></div>
                <div class="absolute left-0 top-0 h-full w-[280px]">
                    <Sidebar @close="ui.closeSidebar" />
                </div>
            </div>
        </transition>
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import Sidebar from "@/components/organisms/Sidebar.vue";
import Topbar from "@/components/organisms/Topbar.vue";
import { useTheme } from "@/composable/useTheme";
import { useUiStore } from "@/store/ui.store";
import { useRoute } from "vue-router";
import ToastContainer from "@/components/organisms/ToastContainer.vue";

const ui = useUiStore();
const theme = useTheme();
const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);
const columnsClass = computed(() =>
    sidebarCollapsed.value
        ? "lg:grid-cols-[80px_1fr]"
        : "lg:grid-cols-[280px_1fr]",
);
const route = useRoute();

watch(
    () => route.fullPath,
    () => {
        ui.closeSidebar();
    },
);
</script>
