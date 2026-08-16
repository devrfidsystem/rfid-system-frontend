<template>
    <li class="space-y-2">
        <div class="flex flex-wrap items-center gap-4 py-1.5">
            <CheckboxField
                :model-value="isGranted(node.id)"
                :label="node.name"
                :object-id="`chk_RoleMenuAccess_${node.id}`"
                @update:model-value="
                    (value) => emit('toggle-access', node.id, value)
                "
            />

            <div
                v-if="isGranted(node.id)"
                class="flex flex-wrap items-center gap-3 pl-6 text-xs text-text-secondary"
            >
                <CheckboxField
                    :model-value="getGrant(node.id).canCreate"
                    label="Create"
                    :object-id="`chk_RoleMenuCreate_${node.id}`"
                    @update:model-value="
                        (value) =>
                            emit(
                                'toggle-permission',
                                node.id,
                                'canCreate',
                                value,
                            )
                    "
                />
                <CheckboxField
                    :model-value="getGrant(node.id).canUpdate"
                    label="Update"
                    :object-id="`chk_RoleMenuUpdate_${node.id}`"
                    @update:model-value="
                        (value) =>
                            emit(
                                'toggle-permission',
                                node.id,
                                'canUpdate',
                                value,
                            )
                    "
                />
                <CheckboxField
                    :model-value="getGrant(node.id).canDelete"
                    label="Delete"
                    :object-id="`chk_RoleMenuDelete_${node.id}`"
                    @update:model-value="
                        (value) =>
                            emit(
                                'toggle-permission',
                                node.id,
                                'canDelete',
                                value,
                            )
                    "
                />
            </div>
        </div>

        <ul
            v-if="node.children && node.children.length"
            class="ml-6 space-y-2 border-l border-border pl-4"
        >
            <RoleMenuTreeNode
                v-for="child in sortedChildren"
                :key="child.id"
                :node="child"
                :is-granted="isGranted"
                :get-grant="getGrant"
                @toggle-access="
                    (menuId, value) => emit('toggle-access', menuId, value)
                "
                @toggle-permission="
                    (menuId, permKey, value) =>
                        emit('toggle-permission', menuId, permKey, value)
                "
            />
        </ul>
    </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
import type { MenuTreeRecord } from "../composables/useRoleMenus";

interface MenuGrant {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

const props = defineProps<{
    node: MenuTreeRecord;
    isGranted: (menuId: string) => boolean;
    getGrant: (menuId: string) => MenuGrant;
}>();

const emit = defineEmits<{
    (event: "toggle-access", menuId: string, value: boolean): void;
    (
        event: "toggle-permission",
        menuId: string,
        key: "canCreate" | "canUpdate" | "canDelete",
        value: boolean,
    ): void;
}>();

defineOptions({ name: "RoleMenuTreeNode" });

const sortedChildren = computed(() =>
    [...(props.node.children ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    ),
);
</script>
