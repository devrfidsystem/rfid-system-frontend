<template>
    <aside
        class="flex h-full w-full flex-col overflow-hidden border-r border-border bg-surface text-text"
        aria-label="Primary navigation"
    >
        <div class="flex h-[60px] shrink-0 justify-center p-4">
            <button
                type="button"
                class="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
                title="Go to dashboard overview"
                @click="navigate('/dashboard/overview')"
            >
                <img
                    :src="brandMark"
                    alt="ALIR Smart System"
                    class="h-6 w-auto shrink-0 object-contain"
                />
            </button>
        </div>

        <div class="px-4 py-3">
            <label class="sr-only" for="sidebar-search">Search menu</label>
            <div class="relative">
                <Search
                    class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
                    :stroke-width="1.75"
                />
                <input
                    id="sidebar-search"
                    v-model="searchQuery"
                    type="search"
                    placeholder="Search menu..."
                    class="h-[var(--control-h-sm)] w-full rounded-md border border-border bg-surface-secondary pl-8 pr-3 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-primary-500"
                />
            </div>
        </div>

        <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <div class="space-y-1">
                <button
                    v-for="item in filteredItems"
                    :key="item.id"
                    type="button"
                    class="group flex h-9 w-full items-center gap-1.5 rounded-md px-3 text-sm transition-colors"
                    :class="[
                        isActive(item.path)
                            ? 'bg-primary-50 font-medium text-primary-600'
                            : 'text-text-secondary hover:bg-surface-secondary',
                        item.depth > 0 ? 'pl-6' : '',
                    ]"
                    @click="navigate(item.path)"
                >
                    <component
                        v-if="item.depth === 0"
                        :is="item.icon"
                        class="h-3.5 w-3.5 shrink-0"
                        :class="
                            isActive(item.path)
                                ? 'text-primary-600'
                                : 'text-text-muted group-hover:text-text'
                        "
                        :stroke-width="1.75"
                    />
                    <span
                        v-else
                        class="h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted/60"
                    />
                    <span class="min-w-0 truncate">
                        {{ item.title }}
                    </span>
                </button>
            </div>
        </nav>
    </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useAccess } from "@/composable/useAccess";
import {
    buildSidebarNavItems,
    flattenSidebarNavItems,
    type SidebarFlatItem,
    type SidebarNavItem,
    type SidebarScope,
} from "@/components/organisms/sidebarNavigation";
import brandMark from "@/assets/image.png";

const emit = defineEmits<{
    (e: "close"): void;
    (e: "navigate", payload: { to: string }): void;
}>();

const props = withDefaults(
    defineProps<{
        scope?: SidebarScope;
    }>(),
    {
        scope: "all",
    },
);

const route = useRoute();
const { menuTree } = useAccess();
const searchQuery = ref("");
const navItems = computed<SidebarNavItem[]>(() =>
    buildSidebarNavItems(menuTree.value, props.scope),
);

const flatNavItems = computed<SidebarFlatItem[]>(() =>
    flattenSidebarNavItems(navItems.value),
);

const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return flatNavItems.value;

    return flatNavItems.value.filter((item) =>
        item.title.toLowerCase().includes(query),
    );
});

const normalizePath = (path: string | null) => {
    if (!path) return "";
    const trimmed = path.replace(/\/+$/, "");
    return trimmed || "/";
};

const isActive = (path: string | null) => {
    const normalized = normalizePath(path);
    if (!normalized) return false;
    return route.path === normalized || route.path.startsWith(`${normalized}/`);
};

const navigate = (to: string | null) => {
    if (!to) return;
    emit("navigate", { to });
};
</script>
