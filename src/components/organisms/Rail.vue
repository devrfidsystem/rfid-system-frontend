<template>
    <aside
        ref="railRef"
        class="relative flex h-full w-16 shrink-0 flex-col overflow-visible rounded-md border border-black/10 bg-primary-900 text-white"
        aria-label="Global navigation"
        @mouseleave="closeFlyout"
    >
        <!-- Rail intentionally uses a blue-industry solid surface so global navigation reads as a separate layer
             from the neutral-light workspace. -->
        <nav class="mt-4 flex flex-col items-center px-2">
            <button
                v-for="item in items"
                :key="item.id"
                type="button"
                class="relative mb-1 flex h-11 w-11 items-center justify-center rounded-md text-gray-400 transition-colors outline-none ring-offset-2 ring-offset-primary-900 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-400"
                :class="isActive(item.id) ? 'bg-white/15 text-white' : ''"
                :title="item.label"
                :aria-label="item.label"
                :aria-current="isActive(item.id) ? 'page' : undefined"
                @mouseenter="openFlyout(item.id, itemIndexMap[item.id])"
                @focus="openFlyout(item.id, itemIndexMap[item.id])"
                @click="navigate(item.id, item.to)"
            >
                <span
                    v-if="isActive(item.id)"
                    class="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-r-full bg-primary-400"
                    aria-hidden="true"
                />
                <component
                    :is="item.icon"
                    class="h-[18px] w-[18px] shrink-0"
                    :stroke-width="1.75"
                />
            </button>
        </nav>

        <div class="flex-1" />

        <div class="relative mb-4 flex justify-center">
            <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-primary-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                :title="avatarLabel ?? 'User menu'"
                :aria-label="avatarLabel ?? 'User menu'"
                @click="toggleAvatarMenu"
            >
                <img
                    v-if="avatarImageUrl"
                    :src="avatarImageUrl"
                    alt=""
                    class="h-8 w-8 rounded-full object-cover"
                />
                <span
                    v-else
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-900"
                >
                    {{ avatarInitials }}
                </span>
            </button>

            <div
                v-if="avatarMenuOpen"
                class="absolute bottom-10 left-12 w-44 rounded-md border border-border bg-surface p-1 text-text shadow-xs"
            >
                <button
                    type="button"
                    class="flex h-9 w-full items-center rounded-md px-3 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text"
                    @click="openProfileSettings"
                >
                    Profile settings
                </button>
                <button
                    type="button"
                    class="flex h-9 w-full items-center rounded-md px-3 text-sm text-danger-600 transition-colors hover:bg-danger-50"
                    @click="logout"
                >
                    Logout
                </button>
            </div>
        </div>

        <transition
            enter-active-class="transition duration-200 ease-out"
            leave-active-class="transition duration-150 ease-in"
            enter-from-class="opacity-0 translate-x-1"
            leave-to-class="opacity-0 translate-x-1"
        >
            <div
                v-if="activeFlyoutItem && flyoutItems.length"
                class="absolute left-[calc(100%+12px)] z-50"
                :style="{ top: `${flyoutTop}px` }"
            >
                <div
                    class="relative w-[300px] overflow-hidden rounded-md border border-border bg-surface text-text shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
                    @mouseenter="keepFlyoutOpen"
                    @mouseleave="closeFlyout"
                >
                    <span
                        class="absolute left-[-7px] top-6 h-3.5 w-3.5 rotate-45 border-l border-b border-border bg-surface"
                        aria-hidden="true"
                    />
                    <div class="border-b border-border px-4 py-3">
                        <p class="text-sm font-semibold text-text">
                            {{ activeFlyoutItem.label }}
                        </p>
                        <p class="text-xs text-text-muted">Menu pada sidebar</p>
                    </div>

                    <div class="max-h-[calc(100vh-10rem)] overflow-y-auto py-2">
                        <button
                            v-for="menu in flyoutItems"
                            :key="menu.id"
                            type="button"
                            class="flex h-10 w-full items-center gap-2 px-4 text-left text-sm transition-colors hover:bg-surface-secondary"
                            :class="
                                isActive(menu.path ?? null)
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-text-secondary'
                            "
                            @click="goTo(menu.path)"
                        >
                            <component
                                :is="menu.icon"
                                class="h-3.5 w-3.5 shrink-0"
                                :class="
                                    isActive(menu.path ?? null)
                                        ? 'text-primary-600'
                                        : 'text-text-muted'
                                "
                                :stroke-width="1.75"
                            />
                            <span class="min-w-0 truncate">
                                {{ menu.title }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";
import type { SidebarFlatItem } from "./sidebarNavigation";

export type RailItem = {
    id: string;
    icon: Component;
    label: string;
    to: string;
};

const props = defineProps<{
    items: RailItem[];
    activeId: string;
    previewItemsById?: Partial<Record<string, SidebarFlatItem[]>>;
    avatarInitials?: string;
    avatarLabel?: string;
    avatarImageUrl?: string | null;
}>();

const emit = defineEmits<{
    (e: "navigate", payload: { to: string }): void;
    (e: "profile-settings"): void;
    (e: "logout"): void;
}>();

const railRef = ref<HTMLElement | null>(null);
const avatarMenuOpen = ref(false);
const hoveredId = ref<string | null>(null);
const hoveredIndex = ref(0);

const avatarInitials = computed(() => props.avatarInitials ?? "U");
const avatarLabel = computed(() => props.avatarLabel ?? "User menu");
const avatarImageUrl = computed(() => props.avatarImageUrl ?? null);
const itemIndexMap = computed<Record<string, number>>(() =>
    props.items.reduce<Record<string, number>>((accumulator, item, index) => {
        accumulator[item.id] = index;
        return accumulator;
    }, {}),
);

const isActive = (id: string | null) => Boolean(id) && props.activeId === id;

const activeFlyoutItem = computed(
    () => props.items.find((item) => item.id === hoveredId.value) ?? null,
);

const flyoutItems = computed<SidebarFlatItem[]>(() => {
    if (!hoveredId.value) return [];
    return props.previewItemsById?.[hoveredId.value] ?? [];
});

const flyoutTop = computed(() => 16 + hoveredIndex.value * 48);

const openFlyout = (id: string, index = 0) => {
    hoveredId.value = id;
    hoveredIndex.value = index;
};

const keepFlyoutOpen = () => {
    if (!hoveredId.value) {
        hoveredId.value = props.activeId;
        hoveredIndex.value = itemIndexMap.value[props.activeId] ?? 0;
    }
};

const closeFlyout = () => {
    hoveredId.value = null;
};

const goTo = (to: string | null) => {
    if (!to) return;
    avatarMenuOpen.value = false;
    hoveredId.value = null;
    emit("navigate", { to });
};

const navigate = (id: string, to?: string) => {
    const item = props.items.find((navItem) => navItem.id === id);
    avatarMenuOpen.value = false;
    hoveredId.value = null;
    emit("navigate", { to: to ?? item?.to ?? "/" });
};

const toggleAvatarMenu = () => {
    hoveredId.value = null;
    avatarMenuOpen.value = !avatarMenuOpen.value;
};

const openProfileSettings = () => {
    avatarMenuOpen.value = false;
    hoveredId.value = null;
    emit("profile-settings");
};

const logout = () => {
    avatarMenuOpen.value = false;
    hoveredId.value = null;
    emit("logout");
};

const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target || !railRef.value) return;
    if (!railRef.value.contains(target)) {
        avatarMenuOpen.value = false;
        hoveredId.value = null;
    }
};

const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        avatarMenuOpen.value = false;
        hoveredId.value = null;
    }
};

onMounted(() => {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleDocumentClick);
    document.removeEventListener("keydown", handleEscape);
});

// The active state is passed from AppLayout so this rail remains presentational and route-agnostic.
</script>
