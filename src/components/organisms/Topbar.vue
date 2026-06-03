<template>
    <header
        class="sticky top-0 z-30 border-b border-border-default bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
    >
        <div
            class="mx-auto max-w-[1400px] px-4 lg:px-6 py-3 flex items-center gap-4"
        >
            <!-- Left: mobile toggle + breadcrumb + sidebar collapse -->
            <div class="flex items-center gap-3">
                <button
                    class="lg:hidden rounded-md border border-border-default bg-white p-2 text-text-secondary shadow-xs transition hover:bg-workspace-bg"
                    @click="$emit('toggle-sidebar')"
                >
                    <Icon :icon="Menu" :size="20" />
                </button>
                <Breadcrumb :items="breadcrumbItems" />
                <IconButton
                    variant="neutral"
                    class="hidden lg:flex"
                    @click="toggleSidebarCollapsed"
                >
                    <Icon
                        :icon="sidebarCollapsed ? ChevronsRight : ChevronsLeft"
                        :size="16"
                    />
                </IconButton>
            </div>

            <!-- Center: space -->
            <div class="flex flex-1 items-center"></div>

            <!-- Right: actions -->
            <div class="flex items-center gap-2">
                <!-- Company Selector -->
                <div
                    class="hidden md:flex items-center gap-2 rounded-md border border-border-default bg-workspace-bg px-3 py-1.5"
                >
                    <label
                        for="company-selector"
                        class="text-xs font-medium uppercase tracking-wider text-gray-500"
                        >Company</label
                    >
                    <select
                        id="company-selector"
                        class="bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer border-none p-0 focus:ring-0"
                        :value="currentCompanyId ?? ''"
                        @change="onCompanyChange"
                    >
                        <option
                            v-for="company in companies"
                            :key="company.companyId"
                            :value="company.companyId"
                        >
                            {{ company.companyName }}
                        </option>
                    </select>
                </div>

                <!-- Notifications -->
                <IconButton
                    variant="neutral"
                    @click="isNotificationOpen = true"
                >
                    <Icon :icon="Bell" :size="18" />
                </IconButton>

                <NotificationDrawer
                    v-model:is-open="isNotificationOpen"
                    @close="isNotificationOpen = false"
                />

                <!-- User Pill -->
                <div
                    class="flex items-center gap-3 rounded-full border border-border-default bg-white px-3 py-1.5 text-sm shadow-xs transition hover:shadow-sm"
                >
                    <div
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white"
                    >
                        {{ userInitials }}
                    </div>
                    <span class="hidden sm:inline font-medium text-gray-800">{{
                        userName
                    }}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        class="px-2 py-1"
                        :loading="logoutLoading"
                        @click="handleLogout"
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Breadcrumb from "@/components/molecules/Breadcrumb.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import IconButton from "@/components/atoms/IconButton.vue";
import NotificationDrawer from "@/components/organisms/NotificationDrawer.vue";
import { Bell, Menu, ChevronsLeft, ChevronsRight } from "lucide-vue-next";
import { useTheme } from "@/composable/useTheme";
import { useAuthStore } from "@/store/auth.store";
import { useNotifier } from "@/composable/useNotifier";

const theme = useTheme();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const logoutLoading = ref(false);
const { withToast } = useNotifier();

const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);

const toggleSidebarCollapsed = () => theme.toggleSidebarCollapsed();

const userName = computed(() => authStore.profile?.user.fullName ?? "User");
const userInitials = computed(() => {
    const name = userName.value;
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
});
const companies = computed(() => authStore.profile?.companies ?? []);
const currentCompanyId = computed(
    () => authStore.currentCompanyId ?? companies.value[0]?.companyId ?? null,
);

const isNotificationOpen = ref(false);

const onCompanyChange = (event: Event) => {
    const target = event.target as HTMLSelectElement | null;
    if (!target?.value) {
        return;
    }
    authStore.setCurrentCompany(target.value);
};

const handleLogout = async () => {
    if (logoutLoading.value) return;

    try {
        await withToast(() => authStore.logout(), {
            loadingRef: logoutLoading,
            successMessage: "Kamu telah keluar dari sesi.",
            errorMessage: "Logout gagal. Coba lagi nanti.",
        });
        await router.replace("/login");
    } catch {
        // already handled by withToast
    }
};

defineEmits<{
    (e: "toggle-sidebar"): void;
}>();

const formatSegment = (segment: string) => {
    if (!segment) return "";
    const specialCases: Record<string, string> = {
        iam: "IAM",
        rfid: "RFID",
        "master-data": "Master Data",
        epc: "EPC",
    };
    if (specialCases[segment.toLowerCase()]) {
        return specialCases[segment.toLowerCase()];
    }
    return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const breadcrumbItems = computed(() => {
    const paths = route.path.split("/").filter(Boolean);

    if (paths.length === 0) {
        return [
            { label: "Command Center", active: false },
            { label: "Dashboard", active: true },
        ];
    }

    const items = [{ label: "Command Center", active: false }];

    paths.forEach((p, i) => {
        items.push({
            label: formatSegment(p),
            active: i === paths.length - 1,
        });
    });

    return items;
});
</script>
