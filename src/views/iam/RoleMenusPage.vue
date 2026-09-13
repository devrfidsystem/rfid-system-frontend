<template>
    <div class="space-y-4">
        <SectionHeader
            title="Role Menus"
            description="Assign which menus and actions each role can access."
            object-id="hdr_RoleMenus"
        >
            <div
                class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
            >
                <div class="w-full sm:w-64">
                    <Select
                        v-model="selectedRoleId"
                        :options="roleOptions"
                        placeholder="Select a role"
                        object-id="cmb_RoleMenusSelectRole"
                    />
                </div>
                <div v-if="appOptions.length > 1" class="w-full sm:w-56">
                    <Select
                        v-model="selectedAppId"
                        :options="appOptions"
                        placeholder="Select application"
                        object-id="cmb_RoleMenusSelectApp"
                    />
                </div>
            </div>
        </SectionHeader>

        <Card object-id="wdg_RoleMenusTree">
            <div v-if="loadingRoles || loadingApps" class="p-6">
                <LoadingState :lines="2" />
            </div>
            <StatusPanel
                v-else-if="!selectedRoleId"
                title="Select a role"
                description="Please select a role to view and manage its menu permissions."
                :icon="Shield"
                tone="neutral"
            />
            <div v-else-if="loadingTree || loadingGrants" class="p-6">
                <LoadingState :lines="6" />
            </div>
            <ul v-else class="space-y-2">
                <RoleMenuTreeNode
                    v-for="node in sortedMenuTree"
                    :key="node.id"
                    :node="node"
                    :is-granted="isGranted"
                    :get-grant="getGrant"
                    @toggle-access="handleToggleAccess"
                    @toggle-permission="handleTogglePermission"
                />
            </ul>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { Shield } from "lucide-vue-next";
import Card from "@/components/molecules/Card.vue";
import SectionHeader from "@/components/molecules/SectionHeader.vue";
import Select from "@/components/atoms/Select.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import RoleMenuTreeNode from "./components/RoleMenuTreeNode.vue";
import { useRoleMenus } from "./composables/useRoleMenus";

const {
    roleOptions,
    selectedRoleId,
    loadingRoles,
    appOptions,
    selectedAppId,
    loadingApps,
    menuTree,
    loadingTree,
    loadingGrants,
    isGranted,
    getGrant,
    loadRoles,
    loadApps,
    toggleAccess,
    togglePermission,
} = useRoleMenus();

const sortedMenuTree = computed(() =>
    [...menuTree.value].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    ),
);

const handleToggleAccess = (menuId: string, value: boolean) => {
    void toggleAccess(menuId, value);
};

const handleTogglePermission = (
    menuId: string,
    key: "canCreate" | "canUpdate" | "canDelete",
    value: boolean,
) => {
    void togglePermission(menuId, key, value);
};

onMounted(() => {
    loadRoles();
    loadApps();
});
</script>
